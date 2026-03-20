import OpenAI from "openai";
import { fromPath } from "pdf2pic";
import sharp from "sharp";
import fs from "fs";
import path from "path";

// Initialize OpenAI client lazily to ensure env vars are loaded
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Extract text from a single image (PNG/JPG) using OpenAI Vision API
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} mimeType - MIME type of image (image/jpeg, image/png)
 * @returns {Promise<{text: string, confidence: number}>}
 */
async function extractTextFromImage(imageBuffer, mimeType = "image/jpeg") {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured. Image OCR is unavailable.");
    }

    // Convert image buffer to base64
    const base64Image = imageBuffer.toString("base64");

    // Use GPT-4 with vision to extract text from bank statement image
    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all transaction data from this bank statement image. List each transaction with: Date, Description, Amount. Return only the extracted data in a clear format, one transaction per line. If this is not a bank statement, respond with 'NOT_A_STATEMENT'.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2048,
    });

    // Extract text from response
    const text = response?.choices?.[0]?.message?.content || "";

    if (text.includes("NOT_A_STATEMENT")) {
      throw new Error("Uploaded image does not appear to be a bank statement.");
    }

    const confidence = estimateConfidence(text);

    return {
      text,
      confidence,
      format: "image",
    };
  } catch (error) {
    console.error("Error extracting text from image:", error);
    throw new Error(`Image OCR failed: ${error.message}`);
  }
}

/**
 * Extract text from PDF by converting pages to images
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} tempFilePath - Temporary file path for PDF
 * @returns {Promise<{text: string, pageCount: number, confidence: number}>}
 */
async function extractTextFromPDF(pdfBuffer, tempFilePath) {
  let tempDir = null;
  let pdfPath = null;

  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured. PDF OCR is unavailable.");
    }

    // Validate PDF buffer size
    if (pdfBuffer.length > 50 * 1024 * 1024) { // 50MB limit
      throw new Error("PDF file is too large (max 50MB)");
    }

    // Create temporary directory for PDF and converted images
    tempDir = path.join(process.cwd(), "temp_ocr_", Date.now());
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save PDF buffer to temporary file
    pdfPath = path.join(tempDir, "statement.pdf");
    fs.writeFileSync(pdfPath, pdfBuffer);

    // Convert PDF to images (first 5 pages max for efficiency)
    const options = {
      density: 150,
      savePath: tempDir,
      pageNumbers: [1, 2, 3, 4, 5], // Limit to first 5 pages
      format: "png",
      fileName: "page",
    };

    let pageCount = 0;
    let combinedText = "";
    let totalConfidence = 0;

    try {
      const converter = await fromPath(pdfPath, options);
      const result = await converter.bulk(-1, { responseType: "image" });

      pageCount = result.length;

      if (pageCount === 0) {
        throw new Error("PDF could not be converted to images");
      }

      // Extract text from each page image
      for (let i = 0; i < result.length; i++) {
        const pageBuffer = result[i];
        const base64Image = pageBuffer.toString("base64");

        const response = await getOpenAIClient().chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all transaction data from this bank statement page. List each transaction with: Date, Description, Amount. Return only the extracted data in a clear format, one transaction per line. If this is not a bank statement, respond with 'NOT_A_STATEMENT'.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 2048,
        });

        const pageText = response?.choices?.[0]?.message?.content || "";

        if (!pageText.includes("NOT_A_STATEMENT")) {
          combinedText += `--- Page ${i + 1} ---\n${pageText}\n\n`;
          totalConfidence += estimateConfidence(pageText);
        }
      }

      if (!combinedText.trim()) {
        throw new Error("No transaction data found in PDF pages");
      }
    } catch (innerError) {
      // Provide better error messages for common PDF issues
      const errorMsg = innerError.message || "";
      if (errorMsg.includes("command not found") || errorMsg.includes("ghostscript")) {
        throw new Error("PDF conversion tool not available. Please upload an image (JPG/PNG) instead.");
      }
      throw new Error("PDF conversion failed: " + errorMsg);
    }

    const avgConfidence = pageCount > 0 ? totalConfidence / pageCount : 0;

    return {
      text: combinedText,
      pageCount,
      confidence: avgConfidence,
      format: "pdf",
    };
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(`PDF OCR failed: ${error.message}`);
  } finally {
    // Cleanup temporary files
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn("Failed to cleanup temp OCR directory:", cleanupError.message);
      }
    }
  }
}

/**
 * Parse OCR-extracted text to identify transaction rows
 * Looks for patterns like: Date | Amount | Description
 * @param {string} ocrText - Raw text from OCR
 * @returns {Array<Object>} - Parsed transactions
 */
function parseExtractedTransactions(ocrText) {
  const transactions = [];
  const lines = ocrText.split("\n").filter((line) => line.trim().length > 0);

  // Regex patterns for common bank statement formats
  const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/;
  const amountPattern = /([₹$€£]?\s*[\d,]+\.?\d{0,2})/;

  for (const line of lines) {
    // Skip header/footer lines and page markers
    if (
      line.toLowerCase().includes("date") ||
      line.toLowerCase().includes("transaction") ||
      line.toLowerCase().includes("statement") ||
      line.toLowerCase().includes("page") ||
      line.toLowerCase().includes("description") ||
      line.toLowerCase().includes("amount") ||
      line.toLowerCase().includes("balance") ||
      line.toLowerCase().startsWith("---") ||
      line.length < 10
    ) {
      continue;
    }

    // Try to extract date and amount
    const dateMatch = line.match(datePattern);
    const amountMatch = line.match(amountPattern);

    if (dateMatch && amountMatch) {
      try {
        const date = normalizeDateString(dateMatch[0]);
        const amount = parseAmountString(amountMatch[0]);
        const description = extractDescription(line, dateMatch[0], amountMatch[0]);

        if (date && amount !== 0 && description) {
          transactions.push({
            date,
            amount,
            description,
            rawLine: line,
          });
        }
      } catch (e) {
        console.warn(`Failed to parse transaction line: "${line}"`, e.message);
        // Continue to next line instead of failing
        continue;
      }
    }
  }

  return transactions;
}

/**
 * Estimate OCR confidence based on text quality
 * @param {string} text - Extracted text
 * @returns {number} - Confidence score 0-100
 */
function estimateConfidence(text) {
  if (!text || text.length === 0) return 0;

  const charCount = text.length;
  const alphabeticRatio = (text.match(/[a-zA-Z]/g) || []).length / charCount;
  const digitRatio = (text.match(/\d/g) || []).length / charCount;
  const symbolRatio = (text.match(/[₹$€£,.-]/g) || []).length / charCount;

  // Good OCR should have decent mix of letters, numbers, and financial symbols
  const qualityScore =
    alphabeticRatio * 40 + // 40% should be text
    digitRatio * 40 + // 40% should be numbers
    symbolRatio * 20; // 20% should be financial symbols

  // Normalize to 0-100
  return Math.min(100, Math.max(0, qualityScore * 100));
}

/**
 * Normalize date string to ISO format (YYYY-MM-DD)
 * @param {string} dateStr - Input date string
 * @returns {string} - Normalized ISO date or null
 */
function normalizeDateString(dateStr) {
  try {
    // Handle common formats: DD-MM-YYYY, MM/DD/YYYY, YYYY-MM-DD
    let day, month, year;

    if (/^\d{4}[-\/]/.test(dateStr)) {
      // YYYY-MM-DD or YYYY/MM/DD
      [year, month, day] = dateStr.split(/[-\/]/);
    } else if (/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/.test(dateStr)) {
      // DD-MM-YYYY or MM-DD-YYYY (assume DD-MM for international banks)
      [day, month, year] = dateStr.split(/[-\/]/);
    } else {
      return null;
    }

    day = String(day).padStart(2, "0");
    month = String(month).padStart(2, "0");
    year = year.length === 2 ? `20${year}` : year;

    const date = new Date(`${year}-${month}-${day}`);
    if (isNaN(date.getTime())) return null;

    return date.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

/**
 * Parse amount from string and return as number
 * Handles currency symbols and formats
 * @param {string} amountStr - Input amount string
 * @returns {number} - Parsed amount
 */
function parseAmountString(amountStr) {
  try {
    // Remove currency symbols and whitespace
    const cleaned = amountStr.replace(/[₹$€£\s]/g, "").replace(/,/g, "");
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : Math.abs(amount);
  } catch {
    return 0;
  }
}

/**
 * Extract description from transaction line
 * @param {string} line - Full transaction line
 * @param {string} dateStr - Date part (to exclude)
 * @param {string} amountStr - Amount part (to exclude)
 * @returns {string} - Extracted description
 */
function extractDescription(line, dateStr, amountStr) {
  let description = line.replace(dateStr, "").replace(amountStr, "").trim();

  // Remove common noise patterns
  description = description.replace(/^[-|•\s]+/, "").trim();
  description = description.replace(/\s+/, " "); // Normalize whitespace

  // Ensure minimum length
  return description.length >= 3 ? description : "Transaction";
}

/**
 * Main handler for bank statement image/PDF uploads
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - MIME type of file
 * @returns {Promise<{text: string, transactions: Array, format: string, pageCount: number, confidence: number}>}
 */
async function handleOCRUpload(fileBuffer, fileName, mimeType) {
  try {
    let ocrResult;

    if (mimeType === "application/pdf") {
      ocrResult = await extractTextFromPDF(fileBuffer, fileName);
    } else if (mimeType.startsWith("image/")) {
      ocrResult = await extractTextFromImage(fileBuffer, mimeType);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Warn if confidence is low
    if (ocrResult.confidence < 60) {
      console.warn(
        `Low OCR confidence (${ocrResult.confidence}%) for ${fileName}. Results may be inaccurate.`
      );
    }

    // Parse extracted text into transactions
    const transactions = parseExtractedTransactions(ocrResult.text);

    if (transactions.length === 0) {
      throw new Error(
        "No transactions detected in document. Bank statement may be in unsupported format."
      );
    }

    return {
      text: ocrResult.text,
      transactions,
      format: ocrResult.format,
      pageCount: ocrResult.pageCount || 1,
      confidence: ocrResult.confidence,
      fileName,
    };
  } catch (error) {
    console.error("OCR upload handler error:", error);
    throw error;
  }
}

export {
  extractTextFromImage,
  extractTextFromPDF,
  parseExtractedTransactions,
  handleOCRUpload,
}