import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import api from "../lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  Sparkles,
  Target,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";

const COLORS = ["#22c55e", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

export default function Dashboard() {
  const location = useLocation();
  const [summary, setSummary] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [healthScore, setHealthScore] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [behavior, setBehavior] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUploadNotice, setShowUploadNotice] = useState(false);

  const month = new Date().toISOString().slice(0, 7);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch core financial data FIRST (fast)
      const [sumRes, breakRes] = await Promise.all([
        api.get("/dashboard/summary?months=6"),
        api.get(`/dashboard/category-breakdown?month=${month}`),
      ]);
      setSummary(sumRes.data);
      setBreakdown(breakRes.data);
      setLoading(false); // Dashboard ready to display!

      // Then fetch AI features in background (slow, but doesn't block UI)
      setTimeout(async () => {
        try {
          const [healthRes, alertsRes, behavRes, suggRes, predRes] = await Promise.all([
            api.get("/ai/health-score").catch(() => ({ data: { score: 0 } })),
            api.get("/ai/risk-alerts").catch(() => ({ data: { alerts: [] } })),
            api.get(`/ai/behavior?month=${month}`).catch(() => ({ data: { analysis: "" } })),
            api.get("/ai/suggestions").catch(() => ({ data: { suggestions: "" } })),
            api.get("/ai/predict?months=1").catch(() => ({ data: null })),
          ]);
          setHealthScore(healthRes.data);
          setAlerts(alertsRes.data.alerts || []);
          setBehavior(behavRes.data?.analysis || "");
          setSuggestions(suggRes.data?.suggestions || "");
          setPrediction(predRes.data);
        } catch (error) {
          console.warn("AI features delayed:", error.message);
        }
        setRefreshing(false);
      }, 100); // Load AI features after UI renders
    } catch (error) {
      console.error("Dashboard error:", error);
      setLoading(false);
      setRefreshing(false);
    }
  }, [month]);

  // Initial load with check for upload redirect
  useEffect(() => {
    (async () => {
      // Check if we're coming from upload page with new data
      if (location.state?.refreshRequired) {
        setShowUploadNotice(true);
        // Clear the state so it doesn't persist on page refresh
        window.history.replaceState({}, document.title);
        // Auto-hide notice after 5 seconds
        setTimeout(() => setShowUploadNotice(false), 5000);
      }

      await fetchDashboardData();
    })();
  }, [month, location, fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
      </div>
    );
  }

  const current = summary[summary.length - 1];
  const income = current?.income ?? 0;
  const expense = current?.expense ?? 0;
  const savings = current?.savings ?? 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 mt-1">Your financial overview with AI insights</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition disabled:opacity-50"
          title="Refresh dashboard data"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Upload success notice */}
      {showUploadNotice && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 animate-slide-in">
          <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-green-200">Bank statement successfully processed! New transactions are displayed below.</span>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                a.severity === "high" ? "bg-red-500/10 border border-red-500/30" : "bg-amber-500/10 border border-amber-500/30"
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span className="text-slate-200">{a.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400">Total Income</span>
            <TrendingUp className="w-5 h-5 text-brand-400" />
          </div>
          <p className="text-2xl font-bold text-brand-400">₹{income.toLocaleString("en-IN")}</p>
          <p className="text-sm text-slate-500 mt-1">This month</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400">Total Expense</span>
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">₹{expense.toLocaleString("en-IN")}</p>
          <p className="text-sm text-slate-500 mt-1">This month</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400">Net Savings</span>
            <Wallet className="w-5 h-5 text-accent-cyan" />
          </div>
          <p className={`text-2xl font-bold ${savings >= 0 ? "text-accent-cyan" : "text-red-400"}`}>
            ₹{savings.toLocaleString("en-IN")}
          </p>
          <p className="text-sm text-slate-500 mt-1">This month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-slate-200 mb-4">Income vs Expense</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  formatter={(v) => [`₹${v.toLocaleString()}`, ""]}
                  labelFormatter={(l) => l}
                />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="font-semibold text-slate-200 mb-4">Spending by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ category, total }) => `${category}: ₹${(total / 1000).toFixed(0)}k`}
                >
                  {breakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  formatter={(v) => [`₹${v.toLocaleString()}`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-slate-200 mb-4">Net Savings Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  formatter={(v) => [`₹${v.toLocaleString()}`, "Savings"]}
                />
                <Line type="monotone" dataKey="savings" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="font-semibold text-slate-200 mb-4">Financial Health Score</h3>
          {healthScore ? (
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#334155" strokeWidth="2" />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={healthScore.score >= 70 ? "#22c55e" : healthScore.score >= 50 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="2"
                    strokeDasharray={`${healthScore.score}, 100`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">{healthScore.score}</span>
              </div>
              <div>
                <p className="text-slate-300">{healthScore.message}</p>
                <div className="mt-2 text-sm text-slate-500">
                  Savings: {healthScore.breakdown.savingsRatio}% • Budget: {healthScore.breakdown.budgetAdherence}% • Goals: {healthScore.breakdown.goalProgress}%
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">Add transactions to see your score</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <h3 className="font-semibold text-slate-200">AI Spending Analysis</h3>
          </div>
          {behavior ? (
            <div className="text-slate-300 text-sm whitespace-pre-wrap">{behavior}</div>
          ) : (
            <p className="text-slate-500">Add transactions to get AI-powered spending insights.</p>
          )}
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-accent-cyan" />
            <h3 className="font-semibold text-slate-200">AI Savings Suggestions</h3>
          </div>
          {suggestions ? (
            <div className="text-slate-300 text-sm whitespace-pre-wrap">{suggestions}</div>
          ) : (
            <p className="text-slate-500">Add more transaction history for personalized suggestions.</p>
          )}
        </div>
      </div>

      {prediction && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-slate-200 mb-2">AI Expense Prediction</h3>
          <p className="text-slate-400">
            Next month's predicted expense: <span className="text-accent-amber font-semibold">₹{prediction.predicted.toLocaleString("en-IN")}</span>
          </p>
        </div>
      )}

      <Link to="/goals" className="flex items-center justify-between glass-card p-6 hover:bg-slate-800/50 transition group">
        <div className="flex items-center gap-3">
          <Target className="w-8 h-8 text-brand-400" />
          <div>
            <h3 className="font-semibold text-slate-200">Financial Goals</h3>
            <p className="text-sm text-slate-500">Set and track your savings goals with AI planning</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-brand-400 transition" />
      </Link>
    </div>
  );
}
