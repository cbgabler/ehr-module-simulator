import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "ehrSimulatorUser";

// Always clear any persisted session on startup so the app opens at the login screen
if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const updateUser = (nextUser) => {
    setUser(nextUser);
  };

  const signIn = async ({ username, password }) => {
    if (typeof window === "undefined" || !window.api?.loginUser) {
      throw new Error("Electron API not available. Please run inside Electron.");
    }
    const response = await window.api.loginUser({ username, password });
    if (!response.success) {
      throw new Error(response.error || "Unable to sign in.");
    }
    const nextUser = response.user;
    updateUser(nextUser);
    return nextUser;
  };

  const register = async ({ username, password, role }) => {
    if (typeof window === "undefined" || !window.api?.registerUser) {
      throw new Error("Electron API not available. Please run inside Electron.");
    }
    const response = await window.api.registerUser({ username, password, role });
    if (!response.success) {
      throw new Error(response.error || "Registration failed.");
    }
    const nextUser = response.user;
    updateUser(nextUser);
    return nextUser;
  };

  const signOut = () => {
    if (window.api?.signOut) {
      window.api.signOut();
    }
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user?.id),
      restoring: false,
      signIn,
      signOut,
      register,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
