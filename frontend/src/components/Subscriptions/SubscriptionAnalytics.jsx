import { Zap, AlertTriangle } from "lucide-react";

export default function SubscriptionAnalytics({ analysis }) {
  const monthlyFormatted = analysis.totalMonthly?.toLocaleString("en-IN");
  const yearlyFormatted = analysis.totalYearly?.toLocaleString("en-IN");
  const savingsFormatted = analysis.potentialSavings?.toLocaleString("en-IN");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Subscriptions */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <p className="text-slate-400 text-sm mb-2">Active Subscriptions</p>
        <h3 className="text-3xl font-bold text-white">{analysis.count}</h3>
      </div>

      {/* Monthly Cost */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <p className="text-slate-400 text-sm mb-2">Monthly Cost</p>
        <h3 className="text-2xl font-bold text-brand-400">₹{monthlyFormatted}</h3>
      </div>

      {/* Yearly Cost */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <p className="text-slate-400 text-sm mb-2">Annual Cost</p>
        <h3 className="text-2xl font-bold text-brand-400">₹{yearlyFormatted}</h3>
      </div>

      {/* Potential Savings */}
      <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-4">
        <p className="text-brand-300 text-sm mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Potential Savings
        </p>
        <h3 className="text-2xl font-bold text-brand-400">₹{savingsFormatted}</h3>
      </div>

      {/* By Frequency */}
      {Object.entries(analysis.byFrequency).map(([frequency, data]) => (
        <div key={frequency} className="col-span-1 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-2 capitalize">{frequency}</p>
          <h3 className="text-xl font-bold text-white">{data.count}</h3>
          <p className="text-xs text-slate-400 mt-1">₹{Math.round(data.totalAmount)}</p>
        </div>
      ))}
    </div>
  );
}
