import { Trash2, Calendar } from "lucide-react";

export default function ScenarioList({ scenarios, onDelete }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {scenarios.map((scenario) => (
        <div key={scenario.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-white">{scenario.name}</h3>
            <button
              onClick={() => onDelete(scenario.id)}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-sm mb-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>{scenario.month}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current</span>
              <span className="font-medium text-white">
                ₹{scenario.results.currentSpending.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Simulated</span>
              <span className="font-medium text-brand-400">
                ₹{scenario.results.simulatedSpending.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Savings Impact</span>
              <span
                className={`font-medium ${
                  scenario.results.savingsDifference >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                ₹{scenario.results.savingsDifference.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Created: {new Date(scenario.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
