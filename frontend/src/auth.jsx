import { createContext, useContext, useMemo, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("svr_user");
    return stored ? JSON.parse(stored) : null;
  });

  const value = useMemo(
    () => ({
      user,
      async login(username, password) {
        const { data } = await api.post("/auth/login/", { username, password });
        localStorage.setItem("svr_access", data.access);
        localStorage.setItem("svr_refresh", data.refresh);
        localStorage.setItem("svr_user", JSON.stringify(data.user));
        setUser(data.user);
      },
      logout() {
        localStorage.removeItem("svr_access");
        localStorage.removeItem("svr_refresh");
        localStorage.removeItem("svr_user");
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
