import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function SimulatorPanel({ categories, onSimulate }) {
  const [changes, setChanges] = useState({});

  const handleCategoryChange = (category, percentChange) => {
    setChanges({
      ...changes,
      [category]: { category, percentChange: parseInt(percentChange) || 0 },
    });
  };

  const handleSimulate = () => {
    const changeArray = Object.values(changes).filter((c) => c.percentChange !== 0);
    onSimulate(changeArray);
  };

  const chartData = Object.entries(categories).map(([category, amount]) => ({
    category: category.substring(0, 12),
    current: amount,
    simulated: amount * (1 + (changes[category]?.percentChange || 0) / 100),
  }));

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-6">
      <h2 className="text-xl font-semibold text-white">Adjust Your Spending</h2>

      {/* Category Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(categories).map(([category, amount]) => (
          <div key={category}>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-white">{category}</label>
              <span className="text-sm text-slate-400">
                {changes[category]?.percentChange || 0}%
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={changes[category]?.percentChange || 0}
              onChange={(e) => handleCategoryChange(category, e.target.value)}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-slate-400 mt-1">
              ₹{amount.toLocaleString("en-IN")} → ₹
              {(amount * (1 + (changes[category]?.percentChange || 0) / 100)).toLocaleString(
                "en-IN"
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Chart */}
      {Object.keys(changes).some((c) => changes[c]?.percentChange !== 0) && (
        <div className="mt-6">
          <p className="text-sm text-slate-300 mb-4">Impact Preview</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="category" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #64748b",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Legend />
              <Bar dataKey="current" fill="#22c55e" name="Current" />
              <Bar dataKey="simulated" fill="#3b82f6" name="Simulated" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Simulate Button */}
      <button
        onClick={handleSimulate}
        disabled={!Object.values(changes).some((c) => c.percentChange !== 0)}
        className="w-full px-6 py-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Run Simulation
      </button>
    </div>
  );
}
