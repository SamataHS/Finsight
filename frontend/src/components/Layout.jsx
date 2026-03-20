import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  MessageSquare,
  Repeat,
  Upload,
  Zap,
  User,
  LogOut,
  Sparkles,
} from "lucide-react";

const nav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: Receipt, label: "Transactions" },
  { to: "/budget", icon: PieChart, label: "Budget" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/chat", icon: MessageSquare, label: "Chat Assistant" },
  { to: "/subscriptions", icon: Repeat, label: "Subscriptions" },
  { to: "/upload", icon: Upload, label: "Upload CSV" },
  { to: "/simulator", icon: Zap, label: "What-If Simulator" },
];

export default function Layout() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 glass-card border-r border-slate-700/50 flex flex-col fixed h-full">
        <Link to="/" className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold gradient-text">Finsight</span>
        </Link>
        <nav className="flex-1 px-4 py-2 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || (to === "/" && location.pathname === "/");
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active ? "bg-brand-500/20 text-brand-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-700/50 space-y-1">
          <Link
            to="/profile"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              location.pathname === "/profile" ? "bg-brand-500/20 text-brand-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            }`}
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
