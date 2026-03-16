import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'ehrSimulatorUser';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    const attemptSessionRestore = async () => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const savedUser = JSON.parse(stored);
          if (savedUser?.id && window.api?.restoreSession) {
            const response = await window.api.restoreSession({ userId: savedUser.id });
            if (response.success) {
              setUser(response.user);
            } else {
              window.localStorage.removeItem(STORAGE_KEY);
            }
          }
        }
      } catch {
        try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      } finally {
        setRestoring(false);
      }
    };

    attemptSessionRestore();
  }, []);

  const signIn = async ({ username, password }) => {
    if (typeof window === 'undefined' || !window.api?.loginUser) {
      throw new Error('Electron API not available. Please run inside Electron.');
    }
    const response = await window.api.loginUser({ username, password });
    if (!response.success) {
      throw new Error(response.error || 'Unable to sign in.');
    }
    const nextUser = response.user;
    setUser(nextUser);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser)); } catch { /* ignore */ }
    return nextUser;
  };

  const register = async ({ username, password, role }) => {
    if (typeof window === 'undefined' || !window.api?.registerUser) {
      throw new Error('Electron API not available. Please run inside Electron.');
    }
    const response = await window.api.registerUser({ username, password, role });
    if (!response.success) {
      throw new Error(response.error || 'Registration failed.');
    }
    const nextUser = response.user;
    setUser(nextUser);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser)); } catch { /* ignore */ }
    return nextUser;
  };

  const signOut = () => {
    if (window.api?.signOut) {
      window.api.signOut();
    }
    setUser(null);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user?.id),
      restoring,
      signIn,
      signOut,
      register,
    }),
    [user, restoring]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
