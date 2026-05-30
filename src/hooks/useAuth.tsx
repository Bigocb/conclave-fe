import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';

/**
 * AuthContext — provides isAuthenticated and logout to the app tree.
 */
export const AuthContext = React.createContext<{
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}>({
  isAuthenticated: false,
  isLoading: true,
  logout: () => {},
});

/**
 * AuthProvider — wraps the app, restores session from localStorage on mount.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const { token, setAuth } = useAuthStore();

  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedOrgId = localStorage.getItem('orgId');
    const savedUserId = localStorage.getItem('userId');
    const savedUserEmail = localStorage.getItem('userEmail');

    if (savedToken && !token) {
      api.setToken(savedToken);
      if (savedOrgId) {
        api.setOrgId(savedOrgId);
      }

      // Try to fetch org details, fallback to minimal auth
      const restoreAuth = async () => {
        if (savedOrgId) {
          try {
            const orgData = await api.get('/v1/orgs/' + savedOrgId);
            const userData = { id: savedUserId || '', email: savedUserEmail || '', org_id: savedOrgId || '', isAdmin: false, name: savedUserEmail || '' };
            setAuth(savedToken, userData, undefined, undefined, orgData as any);
          } catch {
            const userData = { id: savedUserId || '', email: savedUserEmail || '', org_id: savedOrgId || '', isAdmin: false, name: savedUserEmail || '' };
            setAuth(savedToken, userData, undefined, undefined, { id: savedOrgId, name: 'Conclave Org', slug: savedOrgId, policies: {} } as any);
          }
        } else {
          setAuth(savedToken, { id: savedUserId || '', email: savedUserEmail || '', org_id: '', isAdmin: false, name: savedUserEmail || '' });
        }
        setIsLoading(false);
      };
      restoreAuth();
    } else if (token) {
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('orgId');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    useAuthStore.getState().clearAuth();
    api.setToken('');
    api.setOrgId(null);
    window.location.href = '/';
  };

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated) || !!localStorage.getItem('access_token');

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth hook — convenient access to auth state.
 */
export function useAuth() {
  const ctx = React.useContext(AuthContext);
  return ctx;
}
