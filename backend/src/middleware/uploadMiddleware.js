import multer from "multer";
import path from "path";

// Configure storage
const storage = multer.memoryStorage(); // Store in memory for processing

// File filter - allow CSV, PDF, and images
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "text/csv",
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];
  const allowedExtensions = [".csv", ".pdf", ".jpg", ".jpeg", ".png"];

  const isValidMime = allowedMimes.includes(file.mimetype);
  const isValidExt = allowedExtensions.some((ext) =>
    file.originalname.toLowerCase().endsWith(ext)
  );

  if (isValidMime || isValidExt) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only CSV, PDF, JPG, and PNG files are allowed"
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max (larger for PDFs with multiple pages)
  },
});

export { upload };
