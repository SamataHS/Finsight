import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import { Upload, FileText, Check, AlertCircle, Loader } from "lucide-react";
import FileDropzone from "../components/Upload/FileDropzone";
import CSVPreview from "../components/Upload/CSVPreview";
import UploadProgress from "../components/Upload/UploadProgress";
import UploadHistory from "../components/Upload/UploadHistory";

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showpreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get("/uploads/history");
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const isImageOrPDF = (file) => {
    const mimeType = file.type;
    return (
      mimeType === "application/pdf" ||
      mimeType.startsWith("image/")
    );
  };

  const handleFileDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);

    // Handle different file types
    if (selectedFile.type === "text/csv") {
      // Preview CSV
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target.result;
          const lines = text.split("\n");
          const headers = lines[0].split(",").map((h) => h.trim());
          const rows = lines.slice(1, 6).map((line) => {
            const values = line.split(",");
            const row = {};
            headers.forEach((header, i) => {
              row[header] = values[i] || "";
            });
            return row;
          });

          setCsvData({
            headers,
            rows,
            totalRows: lines.length - 1,
          });
          setFilePreview(null);
          setShowPreview(true);
        } catch (err) {
          toast.error("Failed to parse CSV preview");
        }
      };
      reader.readAsText(selectedFile);
    } else if (isImageOrPDF(selectedFile)) {
      // Preview image or PDF
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview({
          type: selectedFile.type,
          fileName: selectedFile.name,
          size: (selectedFile.size / 1024).toFixed(2), // KB
          data: e.target.result,
        });
        setCsvData(null);
        setShowPreview(true);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 30;
        });
      }, 100);

      // Determine endpoint based on file type
      const endpoint = file.type === "text/csv" ? "/uploads/csv" : "/uploads/statement";

      const { data } = await api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      setUploadResult(data);
      toast.success(`${data.inserted} transactions imported successfully!`);

      // Redirect to Dashboard after 2 seconds with pre-loaded data
      setTimeout(() => {
        navigate("/dashboard", {
          state: {
            newTransactions: data.transactions,
            uploadSource: "bank-statement",
            refreshRequired: true,
          },
        });
      }, 2000);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Upload failed");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  if (uploadResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <Loader className="w-16 h-16 text-brand-400 animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Processing Complete!</h1>
          <div className="space-y-2 text-slate-400 mb-6">
            <p>✓ {uploadResult.inserted} transactions imported</p>
            {uploadResult.skipped > 0 && <p>⚠ {uploadResult.skipped} duplicates skipped</p>}
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <p>⚠ {uploadResult.errors.length} errors</p>
            )}
            {uploadResult.ocrConfidence && (
              <p className="text-xs">OCR Confidence: {Math.round(uploadResult.ocrConfidence)}%</p>
            )}
          </div>
          <p className="text-slate-400 text-sm">Redirecting to Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Bank Statement Upload</h1>
        <p className="text-slate-400">
          Upload your bank statement (CSV, PDF, or photo) and automatically import transactions with AI categorization
        </p>
      </div>

      {/* Upload Section */}
      {!showpreview ? (
        <FileDropzone onDrop={handleFileDrop} />
      ) : (
        <div className="space-y-4">
          {/* CSV Preview */}
          {csvData && <CSVPreview data={csvData} />}

          {/* Image/PDF Preview */}
          {filePreview && (
            <div className="border border-slate-700 rounded-lg p-6 bg-slate-800/30">
              {filePreview.type.startsWith("image/") ? (
                <>
                  <p className="text-slate-400 mb-4">Preview:</p>
                  <img
                    src={filePreview.data}
                    alt="Bank statement"
                    className="max-h-96 mx-auto rounded"
                  />
                  <p className="text-xs text-slate-500 mt-4">
                    File: {filePreview.fileName} ({filePreview.size} KB)
                  </p>
                </>
              ) : filePreview.type === "application/pdf" ? (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-white font-medium">{filePreview.fileName}</p>
                  <p className="text-xs text-slate-500 mt-2">{filePreview.size} KB</p>
                  <p className="text-xs text-slate-600 mt-4">
                    PDF will be processed with AI OCR
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* Upload Progress */}
          {uploading && <UploadProgress progress={progress} />}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowPreview(false);
                setCsvData(null);
                setFilePreview(null);
                setFile(null);
              }}
              disabled={uploading}
              className="flex-1 px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition disabled:opacity-50"
            >
              Choose Different File
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 px-6 py-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Import Now"}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Recent Uploads</h2>
        {history.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No uploads yet</p>
        ) : (
          <UploadHistory uploads={history} />
        )}
      </div>
    </div>
  );
}
