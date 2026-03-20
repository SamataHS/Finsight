import { useState, useEffect } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";
import { Bell, Send } from "lucide-react";

export default function AlertPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data } = await api.get("/notifications/preferences");
      setPreferences(data);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to load preferences");
      setLoading(false);
    }
  };

  const handleToggle = async (alertType) => {
    if (!preferences) return;

    const newPrefs = {
      alerts: {
        ...preferences.alerts,
        [alertType]: {
          ...preferences.alerts[alertType],
          enabled: !preferences.alerts[alertType]?.enabled,
        },
      },
    };

    try {
      await api.patch("/notifications/preferences", newPrefs);
      setPreferences(newPrefs);
      toast.success("Preference updated");
    } catch (err) {
      toast.error("Failed to update preference");
    }
  };

  const handleSendTest = async () => {
    try {
      setSending(true);
      await api.post("/notifications/send-test");
      toast.success("Test email sent! Check your inbox");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to send test email");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400">Loading preferences...</div>;
  }

  if (!preferences) {
    return <div className="text-slate-400">No preferences found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Alert Notifications
        </h2>
        <p className="text-slate-400">Manage your email notifications and alerts</p>
      </div>

      {/* Email Address */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <p className="text-sm text-slate-400 mb-2">Email Address</p>
        <p className="text-lg font-medium text-white">{preferences.email}</p>
      </div>

      {/* Alerts */}
      <div className="space-y-4">
        {/* Budget Exceeded */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Budget Exceeded Alerts</p>
            <p className="text-sm text-slate-400">
              Get notified when you exceed category budgets
            </p>
          </div>
          <button
            onClick={() => handleToggle("budgetExceeded")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              preferences.alerts.budgetExceeded?.enabled
                ? "bg-brand-500 text-white"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            {preferences.alerts.budgetExceeded?.enabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        {/* Monthly Report */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Monthly Financial Report</p>
            <p className="text-sm text-slate-400">
              Receive a summary of your monthly finances
            </p>
          </div>
          <button
            onClick={() => handleToggle("monthlyReport")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              preferences.alerts.monthlyReport?.enabled
                ? "bg-brand-500 text-white"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            {preferences.alerts.monthlyReport?.enabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        {/* High Spending */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-white">High Spending Alerts</p>
            <p className="text-sm text-slate-400">
              Alert when spending exceeds threshold
            </p>
          </div>
          <button
            onClick={() => handleToggle("highSpending")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              preferences.alerts.highSpending?.enabled
                ? "bg-brand-500 text-white"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            {preferences.alerts.highSpending?.enabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        {/* Goal Milestone */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Goal Milestones</p>
            <p className="text-sm text-slate-400">
              Celebrate when you reach goal milestones
            </p>
          </div>
          <button
            onClick={() => handleToggle("goalMilestone")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              preferences.alerts.goalMilestone?.enabled
                ? "bg-brand-500 text-white"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            {preferences.alerts.goalMilestone?.enabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>

      {/* Test Email */}
      <button
        onClick={handleSendTest}
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 font-medium transition disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        {sending ? "Sending..." : "Send Test Email"}
      </button>
    </div>
  );
}
