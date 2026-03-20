import { useEffect, useState } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";

export default function Budget() {
  const [status, setStatus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ category: "", amount: "" });

  const fetchData = () => {
    api.get(`/dashboard/budget-status?month=${month}`).then((r) => setStatus(r.data));
    api.get("/transactions/categories").then((r) => setCategories(r.data.categories.filter((c) => !["Salary", "Freelance", "Other Income", "Investments"].includes(c))));
  };

  useEffect(() => {
    fetchData();
    setLoading(false);
  }, [month]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post("/budgets", { category: form.category, amount: parseFloat(form.amount), month });
      toast.success("Budget added");
      setModal(false);
      setForm({ category: "", amount: "" });
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this budget?")) return;
    try {
      await api.delete(`/budgets/${id}`);
      toast.success("Removed");
      fetchData();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Budget</h1>
          <p className="text-slate-400 mt-1">Track spending and stay on budget</p>
        </div>
        <div className="flex gap-3">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-600/50 text-slate-200" />
          <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium transition">
            <Plus className="w-5 h-5" /> Add Budget
          </button>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Set Budget</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-slate-200" required>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Amount (₹)</label>
                <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-slate-200" required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium">Add</button>
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500" />
        </div>
      ) : status.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-slate-400 mb-4">No budgets set for this month</p>
          <button onClick={() => setModal(true)} className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium">Set your first budget</button>
        </div>
      ) : (
        <div className="space-y-4">
          {status.map((b) => (
            <div key={b.id} className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-200">{b.category}</h3>
                  <p className="text-sm text-slate-500">₹{b.spent.toLocaleString("en-IN")} of ₹{b.budget.toLocaleString("en-IN")} • Remaining: ₹{b.remaining.toLocaleString("en-IN")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${b.exceeded ? "text-red-400" : "text-brand-400"}`}>{b.percentUsed}%</span>
                  <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${b.exceeded ? "bg-red-500" : b.percentUsed > 90 ? "bg-amber-500" : "bg-brand-500"}`} style={{ width: `${Math.min(b.percentUsed, 100)}%` }} />
              </div>
              {b.exceeded && <p className="text-red-400 text-sm mt-2">Budget exceeded!</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
