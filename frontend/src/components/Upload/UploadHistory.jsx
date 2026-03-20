import { CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function UploadHistory({ uploads }) {
  return (
    <div className="space-y-3">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-4 flex-1">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                upload.status === "success"
                  ? "bg-green-500/20"
                  : upload.status === "partial"
                    ? "bg-yellow-500/20"
                    : "bg-red-500/20"
              }`}
            >
              {upload.status === "success" ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : upload.status === "partial" ? (
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
            </div>

            <div className="flex-1">
              <p className="text-white font-medium truncate">{upload.fileName}</p>
              <p className="text-sm text-slate-400 mt-1">
                {upload.transactionCount} imported
                {upload.duplicatesSkipped > 0 && ` • ${upload.duplicatesSkipped} duplicates`}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-slate-400 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(upload.uploadDate).toLocaleDateString()}
              </p>
              <p
                className={`text-xs font-medium mt-1 ${
                  upload.status === "success"
                    ? "text-green-400"
                    : upload.status === "partial"
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {upload.status}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
