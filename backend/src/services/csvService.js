import csv from "csv-parser";
import { Readable } from "stream";
import { callGroq } from "./groqService.js";
import { getDB } from "../lib/mongo.js";
import { ObjectId } from "mongodb";
import { matchMerchantCategory } from "./merchantCategorizer.js";

const TRANSACTION_CATEGORIES = [
  "Food & Dining",
  "Rent",
  "Utilities",
  "Transport",
  "Shopping",
  "Entertainment",
  "Travel",
  "Healthcare",
  "Education",
  "Investments",
  "Salary",
  "Freelance",
  "Other Income",
  "Other Expense",
];

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[len2][len1];
}

// Parse CSV file from buffer
async function parseCSV(fileBuffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const readable = Readable.from([fileBuffer]);

    readable
      .pipe(csv())
      .on("data", (data) => {
        results.push(data);
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

// Auto-categorize transaction description
async function autoCategorizeTransaction(description, amount, type = "expense") {
  try {
    // Step 1: Try merchant-based categorization first (fast & accurate)
    const merchantCategory = matchMerchantCategory(description);
    if (merchantCategory) {
      console.log(`✓ Merchant match: "${description}" → ${merchantCategory}`);
      return merchantCategory;
    }

    // Step 2: For income transactions, use special categories
    if (type === "income") {
      if (description.toLowerCase().includes("salary") || description.toLowerCase().includes("payroll")) {
        return "Salary";
      }
      if (description.toLowerCase().includes("freelance") || description.toLowerCase().includes("gig")) {
        return "Freelance";
      }
      return "Other Income";
    }

    // Step 3: For expenses, use intelligent fallback based on description keywords
    const lowerDesc = description.toLowerCase();

    // Quick pattern matching for common expense types
    if (lowerDesc.includes("grocery") || lowerDesc.includes("supermarket")) return "Shopping";
    if (lowerDesc.includes("rent") || lowerDesc.includes("apartment")) return "Rent";
    if (lowerDesc.includes("electric") || lowerDesc.includes("water") || lowerDesc.includes("gas")) return "Utilities";
    if (lowerDesc.includes("doctor") || lowerDesc.includes("hospital") || lowerDesc.includes("pharmacy")) return "Healthcare";
    if (lowerDesc.includes("flight") || lowerDesc.includes("hotel") || lowerDesc.includes("booking")) return "Travel";
    if (lowerDesc.includes("school") || lowerDesc.includes("college") || lowerDesc.includes("tuition")) return "Education";
    if (lowerDesc.includes("stock") || lowerDesc.includes("mutual") || lowerDesc.includes("investment")) return "Investments";

    // Default fallback
    console.log(`⚠ No category match for: "${description}" - using Other Expense`);
    return "Other Expense";
  } catch (e) {
    console.error("Categorization error:", e);
    return type === "income" ? "Other Income" : "Other Expense";
  }
}

// Detect duplicate transactions (original version kept for backward compatibility)
async function detectDuplicates(userId, transactions) {
  const db = getDB();

  const duplicates = [];
  const existingTxs = await db
    .collection("transactions")
    .find({ userId })
    .toArray();

  const existingSet = new Set(
    existingTxs.map((tx) => `${tx.date.getTime()}|${tx.amount}|${tx.description}`)
  );

  for (const tx of transactions) {
    const key = `${new Date(tx.date).getTime()}|${tx.amount}|${tx.description}`;
    if (existingSet.has(key)) {
      duplicates.push(tx);
    }
  }

  return duplicates;
}

// Detect duplicate transactions with fuzzy matching (handles OCR typos)
async function detectDuplicatesWithFuzzy(userId, transactions) {
  const db = getDB();

  const duplicates = [];
  const existingTxs = await db
    .collection("transactions")
    .find({ userId })
    .toArray();

  for (const tx of transactions) {
    // First check for exact match
    const exactMatch = existingTxs.some(
      (existing) =>
        existing.date.getTime() === new Date(tx.date).getTime() &&
        existing.amount === tx.amount &&
        existing.description === tx.description
    );

    if (exactMatch) {
      duplicates.push(tx);
      continue;
    }

    // Check for fuzzy match (handles OCR typos)
    // Consider it a duplicate if: date is within 1 day, amount is exact, description is 85%+ similar
    const fuzzyMatch = existingTxs.some((existing) => {
      const dateDiff = Math.abs(
        existing.date.getTime() - new Date(tx.date).getTime()
      );
      const amountMatch = existing.amount === tx.amount;

      if (dateDiff > 86400000 || !amountMatch) return false; // More than 1 day apart or amount different

      // Check description similarity
      const distance = levenshteinDistance(
        existing.description.toLowerCase(),
        tx.description.toLowerCase()
      );
      const maxLen = Math.max(
        existing.description.length,
        tx.description.length
      );
      const similarity = 1 - distance / maxLen;

      return similarity > 0.85; // 85% similar
    });

    if (fuzzyMatch) {
      duplicates.push(tx);
    }
  }

  return duplicates;
}

// Validate and process transactions
async function processTransactions(userId, rows) {
  const processed = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because row 1 is header, 0-index

      // Parse date
      let date;
      if (row.date) {
        // Handle multiple date formats
        let dateStr = row.date.trim();

        // Try parsing as ISO format (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
          date = new Date(dateStr + "T00:00:00Z"); // Add time to avoid timezone issues
        } else {
          // Try other formats
          date = new Date(dateStr);
        }

        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date format: "${row.date}". Use YYYY-MM-DD format`);
        }
      } else {
        date = new Date();
      }

      // Parse amount
      let amount = 0;
      if (row.amount) {
        amount = parseFloat(row.amount);
        if (isNaN(amount)) {
          throw new Error("Invalid amount");
        }
      }

      // Determine type (income/expense)
      let type = "expense";
      if (row.type) {
        type = row.type.toLowerCase().includes("income") ? "income" : "expense";
      } else {
        // If no explicit type, determine by amount sign
        // Positive = income, Negative = expense
        type = amount > 0 ? "income" : "expense";
        amount = Math.abs(amount); // Always store absolute value
      }

      // Get description
      const description = row.description || row.memo || `Transaction ${i + 1}`;

      // Skip if no amount
      if (amount === 0) {
        throw new Error("Amount cannot be zero");
      }

      // Auto-categorize
      const category = await autoCategorizeTransaction(description, amount, type);

      processed.push({
        userId,
        type,
        amount,
        category,
        description,
        date,
      });
    } catch (e) {
      errors.push({
        rowNumber: i + 2,
        error: e.message,
      });
    }
  }

  return { processed, errors };
}

// Insert processed transactions
async function insertTransactions(userId, transactions) {
  const db = getDB();

  if (transactions.length === 0) {
    return { insertedCount: 0, insertedIds: [] };
  }

  const result = await db.collection("transactions").insertMany(
    transactions.map((tx) => ({
      ...tx,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );

  return {
    insertedCount: result.insertedCount,
    insertedIds: Object.values(result.insertedIds),
  };
}

// Main upload handler
async function handleBankUpload(userId, file, fileName) {
  try {
    // Parse CSV
    const rows = await parseCSV(file.buffer);

    if (rows.length === 0) {
      throw new Error("CSV file is empty");
    }

    // Process transactions
    const { processed, errors } = await processTransactions(userId, rows);

    // For now, skip duplicate detection - insert all transactions
    // Duplicate detection can be added back later with user confirmation
    const unique = processed;

    // Insert transactions
    const { insertedCount, insertedIds } = await insertTransactions(userId, unique);

    // Record upload
    const db = getDB();
    const status = errors.length === 0 ? "success" : "partial";

    const uploadRecord = {
      userId,
      fileName: fileName || "bank_statement.csv",
      transactionCount: insertedCount,
      status,
      errors,
      transactions: insertedIds,
      metadata: {
        format: "csv",
        duplicatesSkipped: 0,
      },
      uploadDate: new Date(),
      createdAt: new Date(),
    };

    const result = await db.collection("bankUploads").insertOne(uploadRecord);

    return {
      success: true,
      uploadId: result.insertedId,
      inserted: insertedCount,
      skipped: 0,
      errors: errors.slice(0, 10), // Limit error messages for response
      transactions: unique.map((tx) => ({
        date: tx.date,
        amount: tx.amount,
        category: tx.category,
        description: tx.description,
        type: tx.type,
      })),
    };
  } catch (e) {
    console.error("Bank upload error:", e);
    throw e;
  }
}

// Handle OCR-extracted transaction data from images/PDFs
async function handleOCRUpload(userId, ocrData, fileName) {
  try {
    // Convert OCR parsed transactions into standard format
    const rows = ocrData.transactions.map((tx) => ({
      date: tx.date,
      amount: String(tx.amount),
      description: tx.description,
      memo: tx.description,
      type: "expense", // Will be determined during processing if amount is positive for income
    }));

    if (rows.length === 0) {
      throw new Error("No transactions found in OCR data");
    }

    // Process transactions (parse dates, amounts, auto-categorize)
    const { processed, errors } = await processTransactions(userId, rows);

    // For now, skip duplicate detection - insert all transactions
    const unique = processed;

    // Insert transactions
    const { insertedCount, insertedIds } = await insertTransactions(userId, unique);

    // Record upload
    const db = getDB();
    const status = errors.length === 0 ? "success" : "partial";

    const uploadRecord = {
      userId,
      fileName: fileName || "bank_statement.pdf",
      transactionCount: insertedCount,
      status,
      errors,
      transactions: insertedIds,
      metadata: {
        format: ocrData.format || "image",
        ocrConfidence: ocrData.confidence || 0,
        pageCount: ocrData.pageCount || 1,
        duplicatesSkipped: 0,
      },
      uploadDate: new Date(),
      createdAt: new Date(),
    };

    const result = await db.collection("bankUploads").insertOne(uploadRecord);

    return {
      success: true,
      uploadId: result.insertedId,
      inserted: insertedCount,
      skipped: 0,
      errors: errors.slice(0, 10),
      ocrConfidence: ocrData.confidence,
      transactions: unique.map((tx) => ({
        date: tx.date,
        amount: tx.amount,
        category: tx.category,
        description: tx.description,
        type: tx.type,
      })),
    };
  } catch (e) {
    console.error("OCR upload error:", e);
    throw e;
  }
}

export {
  parseCSV,
  autoCategorizeTransaction,
  handleBankUpload,
  detectDuplicates,
  detectDuplicatesWithFuzzy,
  handleOCRUpload,
};
