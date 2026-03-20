import { useState } from "react";
import { Save, TrendingUp, TrendingDown } from "lucide-react";

export default function ImpactSummary({ current, simulated, difference, rateImpact, onSave }) {
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [scenarioName, setScenarioName] = useState("");

  const handleSave = () => {
    if (!scenarioName.trim()) return;
    onSave(scenarioName);
    setScenarioName("");
    setShowSaveForm(false);
  };

  const isPositive = difference >= 0;

  return (
    <div className="bg-gradient-to-br from-brand-500/10 to-brand-500/5 border border-brand-500/30 rounded-2xl p-6 space-y-6">
      <h2 className="text-xl font-semibold text-white">Simulation Results</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Spending */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-1">Current Spending</p>
          <p className="text-2xl font-bold text-white">₹{current.toLocaleString("en-IN")}</p>
        </div>

        {/* Simulated Spending */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-1">Simulated Spending</p>
          <p className="text-2xl font-bold text-white">₹{simulated.toLocaleString("en-IN")}</p>
        </div>

        {/* Difference */}
        <div
          className={`rounded-lg p-4 ${
            isPositive ? "bg-green-500/10" : "bg-red-500/10"
          }`}
        >
          <p className={`text-sm mb-1 ${isPositive ? "text-green-300" : "text-red-300"}`}>
            {isPositive ? "Additional Savings" : "More Spending"}
          </p>
          <p className={`text-2xl font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
            ₹{Math.abs(difference).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Savings Rate Impact */}
        <div
          className={`rounded-lg p-4 ${
            isPositive ? "bg-green-500/10" : "bg-red-500/10"
          }`}
        >
          <p className={`text-sm mb-1 ${isPositive ? "text-green-300" : "text-red-300"}`}>
            Savings Rate Change
          </p>
          <p className={`text-2xl font-bold flex items-center gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? "+" : "-"}
            {Math.abs(rateImpact).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Save Scenario */}
      {!showSaveForm ? (
        <button
          onClick={() => setShowSaveForm(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 font-medium transition"
        >
          <Save className="w-4 h-4" />
          Save This Scenario
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Scenario name (e.g., 'Reduce food by 30%')"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium transition"
          >
            Save
          </button>
          <button
            onClick={() => {
              setShowSaveForm(false);
              setScenarioName("");
            }}
            className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
