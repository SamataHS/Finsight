import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import toast from "react-hot-toast";
import { Plus, Trash2, TrendingDown } from "lucide-react";
import SimulatorPanel from "../components/Simulator/SimulatorPanel";
import ImpactSummary from "../components/Simulator/ImpactSummary";
import ScenarioList from "../components/Simulator/ScenarioList";

export default function Simulator() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [scenarios, setScenarios] = useState([]);
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenarios();
    fetchCurrentSpending();
  }, [currentMonth]);

  const fetchCurrentSpending = async () => {
    try {
      const [year, month] = currentMonth.split("-");
      const startDate = new Date(year, parseInt(month) - 1, 1);
      const endDate = new Date(year, parseInt(month), 0, 23, 59, 59);

      const { data } = await api.get("/transactions", {
        params: {
          month: currentMonth,
          type: "expense",
        },
      });

      const byCategory = {};
      data.forEach((tx) => {
        byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount;
      });

      setCategories(byCategory);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch spending:", err);
      setLoading(false);
    }
  };

  const fetchScenarios = async () => {
    try {
      const { data } = await api.get("/simulator/scenarios");
      setScenarios(data);
    } catch (err) {
      console.error("Failed to fetch scenarios:", err);
    }
  };

  const handleSimulate = async (changes) => {
    try {
      const { data } = await api.post("/simulator/simulate", {
        month: currentMonth,
        changes,
      });

      setActiveSimulation({
        changes,
        results: data,
      });
    } catch (err) {
      toast.error("Simulation failed");
    }
  };

  const handleSaveScenario = async (name) => {
    if (!activeSimulation) return;

    try {
      await api.post("/simulator/scenarios", {
        name,
        month: currentMonth,
        changes: activeSimulation.changes,
      });

      toast.success("Scenario saved");
      fetchScenarios();
    } catch (err) {
      toast.error("Failed to save scenario");
    }
  };

  const handleDeleteScenario = async (id) => {
    if (!confirm("Delete this scenario?")) return;

    try {
      await api.delete(`/simulator/scenarios/${id}`);
      toast.success("Scenario deleted");
      fetchScenarios();
    } catch (err) {
      toast.error("Failed to delete scenario");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">What-If Simulator</h1>
        <p className="text-slate-400">
          Simulate spending changes and see their impact on your finances
        </p>
      </div>

      {/* Month Selector */}
      <div className="flex gap-4">
        <div>
          <label className="text-sm text-slate-400 block mb-2">Simulation Month</label>
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Main Simulator */}
      {Object.keys(categories).length > 0 && (
        <>
          <SimulatorPanel
            categories={categories}
            onSimulate={handleSimulate}
          />

          {activeSimulation && (
            <>
              <ImpactSummary
                current={activeSimulation.results.currentSpending}
                simulated={activeSimulation.results.simulatedSpending}
                difference={activeSimulation.results.savingsDifference}
                rateImpact={activeSimulation.results.savingsRateImpact}
                onSave={handleSaveScenario}
              />
            </>
          )}
        </>
      )}

      {/* Saved Scenarios */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Saved Scenarios</h2>
        {scenarios.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            No saved scenarios yet. Run a simulation and save it!
          </p>
        ) : (
          <ScenarioList
            scenarios={scenarios}
            onDelete={handleDeleteScenario}
          />
        )}
      </div>
    </div>
  );
}
