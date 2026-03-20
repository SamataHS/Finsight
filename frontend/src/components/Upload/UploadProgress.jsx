import { Loader } from "lucide-react";

export default function UploadProgress({ progress }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Loader className="w-5 h-5 text-brand-400 animate-spin" />
        <h2 className="text-xl font-semibold text-white">Uploading...</h2>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-brand-400 to-brand-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-slate-400 text-sm mt-3">{Math.round(progress)}% complete</p>
    </div>
  );
}
