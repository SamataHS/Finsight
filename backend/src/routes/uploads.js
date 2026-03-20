import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { handleBankUpload, handleOCRUpload } from "../services/csvService.js";
import { isGroqAvailable } from "../services/groqService.js";
import { getDB } from "../lib/mongo.js";

const uploadRouter = Router();

uploadRouter.use(authMiddleware);

// ✅ Upload CSV file
uploadRouter.post("/csv", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file provided",
      });
    }

    const result = await handleBankUpload(req.userId, req.file, req.file.originalname);

    res.status(201).json(result);
  } catch (e) {
    console.error("UPLOAD ERROR:", e);

    res.status(500).json({
      error: e.message || "Failed to upload file",
    });
  }
});

// ✅ Upload bank statement image or PDF
uploadRouter.post("/statement", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file provided",
      });
    }

    // Detect file type
    const mimeType = req.file.mimetype;
    const isCSV = mimeType === "text/csv" || req.file.originalname.toLowerCase().endsWith(".csv");

    if (isCSV) {
      // Route CSV to existing handler
      const result = await handleBankUpload(req.userId, req.file, req.file.originalname);
      return res.status(201).json(result);
    }

    // For images/PDFs with Ollama-only setup
    const isPDF = mimeType === "application/pdf";
    const isImage = mimeType.startsWith("image/");

    if (!isPDF && !isImage) {
      return res.status(400).json({
        error: "Unsupported file format. Please upload CSV, PDF, JPG, or PNG.",
      });
    }

    // Check if Groq is available
    const groqAvailable = await isGroqAvailable();

    if (!groqAvailable) {
      return res.status(503).json({
        error: "AI service is unavailable. Please ensure GROQ_API_KEY is set in .env or upload a CSV file instead.",
      });
    }

    // For now, we recommend CSV for Groq setup
    // Image processing requires external OCR tools or vision models
    return res.status(400).json({
      error: "Image OCR with Groq requires additional setup. Please convert your statement to CSV or use an online OCR tool first, then upload the CSV.",
    });
  } catch (e) {
    console.error("STATEMENT UPLOAD ERROR:", e);

    res.status(400).json({
      error: e.message || "Failed to process bank statement",
    });
  }
});

// ✅ Get upload history
uploadRouter.get("/history", async (req, res) => {
  try {
    const db = getDB();

    const uploads = await db
      .collection("bankUploads")
      .find({ userId: req.userId })
      .sort({ uploadDate: -1 })
      .limit(20)
      .toArray();

    res.json(
      uploads.map((u) => ({
        id: u._id,
        fileName: u.fileName,
        uploadDate: u.uploadDate,
        transactionCount: u.transactionCount,
        status: u.status,
        duplicatesSkipped: u.metadata?.duplicatesSkipped || 0,
        format: u.metadata?.format || "csv",
        ocrConfidence: u.metadata?.ocrConfidence || null,
      }))
    );
  } catch (e) {
    console.error("UPLOAD HISTORY ERROR:", e);

    res.status(500).json({
      error: "Failed to fetch upload history",
    });
  }
});

export { uploadRouter };
