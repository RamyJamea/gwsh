import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi, setToken, UserResponse } from './api-client';

interface AuthState {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<UserResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (!savedToken) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }

    let cancelled = false;
    setToken(savedToken);
    authApi.profile()
      .then(profile => {
        if (!cancelled) {
          setState({ user: profile, token: savedToken, isLoading: false, error: null });
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('activeBranchId');
          localStorage.removeItem('activeBranchName');
          setToken(null);
          setState({ user: null, token: null, isLoading: false, error: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<UserResponse> => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const tokenData = await authApi.login(username, password);
      setToken(tokenData.access_token);
      const profile = await authApi.profile();
      localStorage.setItem('authToken', tokenData.access_token);
      setState({
        user: profile,
        token: tokenData.access_token,
        isLoading: false,
        error: null,
      });
      return profile;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setState(s => ({ ...s, isLoading: false, error: msg, token: null, user: null }));
      setToken(null);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('activeBranchId');
    localStorage.removeItem('activeBranchName');
    localStorage.removeItem('cashierName');
    setState({ user: null, token: null, isLoading: false, error: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
