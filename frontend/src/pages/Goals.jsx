import { useEffect, useState } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";
import { Plus, Target, Sparkles, Trash2 } from "lucide-react";

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [planModal, setPlanModal] = useState(null);
  const [editGoal, setEditGoal] = useState(null);
  const [addAmount, setAddAmount] = useState("");
  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState({ name: "", targetAmount: "", currentAmount: "0", targetDate: "" });

  const fetchGoals = () => api.get("/goals").then((r) => setGoals(r.data));

  useEffect(() => {
    setLoading(true);
    fetchGoals().finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/goals", {
        name: form.name,
        targetAmount: parseFloat(form.targetAmount),
        currentAmount: parseFloat(form.currentAmount),
        targetDate: form.targetDate || undefined,
      });
      toast.success("Goal created");
      setModal(false);
      setForm({ name: "", targetAmount: "", currentAmount: "0", targetDate: "" });
      fetchGoals();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this goal?")) return;
    try {
      await api.delete(`/goals/${id}`);
      toast.success("Deleted");
      fetchGoals();
    } catch {
      toast.error("Failed");
    }
  };

  const handleAddToGoal = async (e) => {
    e.preventDefault();
    if (!editGoal) return;
    try {
      await api.patch(`/goals/${editGoal._id}`, { currentAmount: editGoal.currentAmount + parseFloat(addAmount) });
      toast.success("Progress updated");
      setEditGoal(null);
      setAddAmount("");
      fetchGoals();
    } catch {
      toast.error("Failed");
    }
  };

  const fetchPlan = (goalId) => {
    api.get(`/ai/goal-plan/${goalId}`).then((r) => {
      setPlan(r.data);
      setPlanModal(goalId);
    }).catch(err => {
      toast.error(err?.response?.data?.error || "Failed to load plan");
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Financial Goals</h1>
          <p className="text-slate-400 mt-1">Set goals and get AI-powered savings plans</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium transition">
          <Plus className="w-5 h-5" /> Add Goal
        </button>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">New Goal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Goal Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-slate-200" placeholder="e.g. New Laptop" required />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Target Amount (₹)</label>
                <input type="number" step="0.01" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-slate-200" required />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Current Amount (₹)</label>
                <input type="number" step="0.01" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-slate-200" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Target Date</label>
                <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-slate-200" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium">Add Goal</button>
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditGoal(null)}>
          <div className="glass-card p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Add to {editGoal.name}</h2>
            <form onSubmit={handleAddToGoal} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Amount to add (₹)</label>
                <input type="number" step="0.01" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-slate-200" required />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium">Add</button>
                <button type="button" onClick={() => setEditGoal(null)} className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {planModal && plan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setPlanModal(null)}>
          <div className="glass-card p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <h2 className="text-xl font-semibold">AI Savings Plan</h2>
            </div>
            <div className="space-y-3 text-slate-300">
              <p><span className="text-slate-500">Required monthly savings:</span> ₹{plan.monthlySavingsRequired?.toLocaleString("en-IN") || "N/A"}</p>
              <p><span className="text-slate-500">Months to target:</span> {plan.monthsUntilTarget || "N/A"}</p>
              <div className="pt-4 border-t border-slate-700">
                <p className="text-slate-400 text-sm mb-2">AI Savings Plan:</p>
                <p className="whitespace-pre-wrap text-sm">{plan.plan || "No plan generated yet"}</p>
              </div>
            </div>
            <button onClick={() => setPlanModal(null)} className="mt-4 px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600">Close</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500" />
        </div>
      ) : goals.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Target className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No goals yet. Set your first financial goal!</p>
          <button onClick={() => setModal(true)} className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium">Add Goal</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
            return (
              <div key={g._id} className="glass-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-200">{g.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      ₹{g.currentAmount.toLocaleString("en-IN")} / ₹{g.targetAmount.toLocaleString("en-IN")}
                      {g.targetDate && ` • Target: ${new Date(g.targetDate).toLocaleDateString()}`}
                    </p>
                    <div className="h-2 rounded-full bg-slate-700 overflow-hidden mt-3">
                      <div className="h-full bg-gradient-to-r from-brand-500 to-accent-cyan rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditGoal(g)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600 text-sm">Add</button>
                    <button onClick={() => fetchPlan(g._id)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 text-sm">
                      <Sparkles className="w-4 h-4" /> AI Plan
                    </button>
                    <button onClick={() => handleDelete(g._id)} className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
