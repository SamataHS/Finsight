import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import toast from "react-hot-toast";
import { Plus, Trash2, TrendingUp, AlertCircle } from "lucide-react";
import SubscriptionCard from "../components/Subscriptions/SubscriptionCard";
import SubscriptionAnalytics from "../components/Subscriptions/SubscriptionAnalytics";

export default function Subscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [detected, setDetected] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetected, setShowDetected] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    frequency: "monthly",
    category: "Entertainment",
    dayOfCycle: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsRes, detectedRes, analysisRes] = await Promise.all([
        api.get("/subscriptions"),
        api.get("/subscriptions/detect"),
        api.get("/subscriptions/analysis"),
      ]);

      setSubscriptions(subsRes.data);
      setDetected(detectedRes.data);
      setAnalysis(analysisRes.data);
    } catch (err) {
      toast.error("Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubscription = async (e) => {
    e.preventDefault();
    try {
      await api.post("/subscriptions", {
        ...formData,
        amount: parseFloat(formData.amount),
        dayOfCycle: parseInt(formData.dayOfCycle),
      });
      toast.success("Subscription added");
      setFormData({
        name: "",
        amount: "",
        frequency: "monthly",
        category: "Entertainment",
        dayOfCycle: 1,
      });
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to add subscription");
    }
  };

  const handleConfirmDetected = async (detected) => {
    try {
      await api.post("/subscriptions", detected);
      toast.success("Subscription confirmed");
      setDetected(detected.filter((d) => d.name !== detected.name));
      fetchData();
    } catch (err) {
      toast.error("Failed to confirm subscription");
    }
  };

  const handleDeleteSubscription = async (id) => {
    if (!confirm("Delete this subscription?")) return;
    try {
      await api.delete(`/subscriptions/${id}`);
      toast.success("Subscription deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete subscription");
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
        <h1 className="text-4xl font-bold text-white mb-2">Subscription Tracker</h1>
        <p className="text-slate-400">
          Manage your recurring subscriptions and detect potential cost savings
        </p>
      </div>

      {/* Analysis Summary */}
      {analysis && (
        <SubscriptionAnalytics analysis={analysis} />
      )}

      {/* Detected Subscriptions */}
      {detected.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-white">
                {detected.length} Potential Subscriptions Detected
              </h2>
              <p className="text-sm text-blue-200 mt-1">
                Click "Confirm" to add them to your tracker
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {detected.slice(0, 5).map((sub) => (
              <div
                key={sub.name}
                className="flex items-center justify-between p-3 bg-blue-500/5 rounded-lg"
              >
                <div>
                  <p className="font-medium text-white">{sub.name}</p>
                  <p className="text-sm text-slate-400">
                    ₹{sub.amount} / {sub.frequency} (Confidence: {sub.confidence}%)
                  </p>
                </div>
                <button
                  onClick={() => handleConfirmDetected(sub)}
                  className="px-3 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-medium transition"
                >
                  Confirm
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Subscription Form */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Manual Subscription
        </h2>

        <form onSubmit={handleAddSubscription} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Name (e.g., Netflix)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />

          <input
            type="number"
            placeholder="Amount (₹)"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />

          <select
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-brand-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>

          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-brand-500"
          >
            <option value="Entertainment">Entertainment</option>
            <option value="Software">Software</option>
            <option value="Utilities">Utilities</option>
            <option value="Food & Dining">Food & Dining</option>
            <option value="Other">Other</option>
          </select>

          <button
            type="submit"
            className="md:col-span-2 px-6 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium transition"
          >
            Add Subscription
          </button>
        </form>
      </div>

      {/* Subscriptions List */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Your Subscriptions</h2>

        {subscriptions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>No subscriptions yet. Add one manually or confirm detected ones above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                onDelete={handleDeleteSubscription}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
