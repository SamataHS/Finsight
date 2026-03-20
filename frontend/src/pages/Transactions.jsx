import { useEffect, useState } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, ArrowDownLeft, ArrowUpRight, Repeat } from "lucide-react";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recurring, setRecurring] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const fetchData = () => {
    api.get(`/transactions?month=${month}`).then((r) => setTransactions(r.data));
    api.get("/transactions/categories").then((r) => setCategories(r.data.categories));
    // Recurring transactions endpoint not yet implemented, skip for now
  };

  useEffect(() => {
    fetchData();
    setLoading(false);
  }, [month]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/transactions/${editing._id}`, { ...form, amount: parseFloat(form.amount), date: form.date });
        toast.success("Transaction updated");
      } else {
        await api.post("/transactions", { ...form, amount: parseFloat(form.amount), date: form.date });
        toast.success("Transaction added");
      }
      setModal(null);
      setEditing(null);
      setForm({ type: "expense", amount: "", category: "", description: "", date: new Date().toISOString().slice(0, 10) });
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success("Deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  const openEdit = (tx) => {
    setEditing(tx);
    setForm({
      type: tx.type,
      amount: tx.amount.toString(),
      category: tx.category,
      description: tx.description || "",
      date: tx.date.slice(0, 10),
    });
    setModal("edit");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Transactions</h1>
          <p className="text-slate-400 mt-1">Manage your income and expenses</p>
        </div>
        <div className="flex gap-3">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-600/50 text-slate-200" />
          <button
            onClick={() => {
              setEditing(null);
              setForm({ type: "expense", amount: "", category: "", description: "", date: new Date().toISOString().slice(0, 10) });
              setModal("add");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium transition"
          >
            <Plus className="w-5 h-5" /> Add
          </button>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">{editing ? "Edit" : "Add"} Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-slate-200">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Amount (₹)</label>
                <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-slate-200" required />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-slate-200" required>
                  <option value="">Select</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-slate-200" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-slate-200" required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium">{editing ? "Update" : "Add"}</button>
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-slate-400 mb-4">No transactions yet</p>
          <button onClick={() => setModal("add")} className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium">Add your first transaction</button>
        </div>
      ) : (
        <>
          {recurring.length > 0 && (
            <div className="glass-card p-6 mb-6">
              <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Repeat className="w-5 h-5 text-accent-cyan" /> Recurring Transactions
              </h3>
              <div className="flex flex-wrap gap-2">
                {recurring.map((r) => (
                  <span key={r.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-sm">
                    {r.category}: ₹{r.amount.toLocaleString()} ({r.frequency})
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Type</th>
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Date</th>
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Category</th>
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Description</th>
                    <th className="text-right py-4 px-4 text-slate-400 font-medium">Amount</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 ${tx.type === "income" ? "text-brand-400" : "text-red-400"}`}>
                          {tx.type === "income" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-slate-300">{tx.category}</td>
                      <td className="py-3 px-4 text-slate-400">{tx.description || "—"}</td>
                      <td className={`py-3 px-4 text-right font-medium ${tx.type === "income" ? "text-brand-400" : "text-red-400"}`}>
                        {tx.type === "income" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEdit(tx)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(tx._id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
