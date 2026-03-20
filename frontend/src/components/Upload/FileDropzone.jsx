import { useDropzone } from "react-dropzone";
import { Upload, FileText, Image, FileJson } from "lucide-react";

export default function FileDropzone({ onDrop }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
        isDragActive
          ? "border-brand-500 bg-brand-500/10"
          : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/30"
      }`}
    >
      <input {...getInputProps()} />

      <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-500/10">
        <Upload className="w-8 h-8 text-brand-400" />
      </div>

      {isDragActive ? (
        <>
          <h3 className="text-xl font-semibold text-brand-400 mb-2">Drop your file here</h3>
          <p className="text-slate-400">Your statement will be processed</p>
        </>
      ) : (
        <>
          <h3 className="text-xl font-semibold text-white mb-2">Drag & drop your bank statement</h3>
          <p className="text-slate-400 mb-4">Or click to select a file</p>
          <div className="space-y-2 text-sm text-slate-500">
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              <span>CSV format</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <FileJson className="w-4 h-4" />
              <span>PDF bank statements</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Image className="w-4 h-4" />
              <span>Photos (JPG/PNG)</span>
            </div>
            <div className="text-xs text-slate-600 mt-3">Max 10MB • Auto-categorized with AI</div>
          </div>
        </>
      )}
    </div>
  );
}
