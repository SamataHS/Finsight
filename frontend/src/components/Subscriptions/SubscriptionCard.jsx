import { Trash2, TrendingUp } from "lucide-react";

export default function SubscriptionCard({ subscription, onDelete }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white">{subscription.name}</h3>
          <p className="text-xs text-slate-400 mt-1">{subscription.category}</p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${
            subscription.status === "active"
              ? "bg-green-500/20 text-green-400"
              : "bg-slate-700 text-slate-400"
          }`}
        >
          {subscription.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-slate-400 text-sm">Amount</span>
          <span className="text-white font-medium">₹{subscription.amount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 text-sm">Frequency</span>
          <span className="text-white font-medium text-capitalize">{subscription.frequency}</span>
        </div>
        {subscription.confidence > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">Confidence</span>
            <span className="text-brand-400 font-medium">{subscription.confidence}%</span>
          </div>
        )}
      </div>

      <button
        onClick={() => onDelete(subscription.id)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition text-sm"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  );
}
