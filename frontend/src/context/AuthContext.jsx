import { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("finsight_token");
    const u = localStorage.getItem("finsight_user");
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
      api.get("/auth/me").then((r) => {
        setUser(r.data);
        localStorage.setItem("finsight_user", JSON.stringify(r.data));
      }).catch(() => {
        localStorage.removeItem("finsight_token");
        localStorage.removeItem("finsight_user");
        setToken(null);
        setUser(null);
      }).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("finsight_token", data.token);
    localStorage.setItem("finsight_user", JSON.stringify(data.user));
  };

  const signup = async (email, password, firstName, lastName) => {
    // Just create account, don't log in
    await api.post("/auth/signup", { email, password, firstName, lastName });
    // Account created successfully - user will log in manually
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("finsight_token");
    localStorage.removeItem("finsight_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
