import React, { useEffect, useState, createContext, useContext } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { Agent, Principal, Org } from '../types/api';

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, setAuth, clearAuth, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        api.setToken(token);
        const identity = await api.get<{ agent_id: string, principal_id: string, org_id: string }>('/v1/agents/me');
        const agent = await api.get<Agent>(`/v1/agents/${identity.agent_id}`);
        const principal = await api.get<Principal>(`/v1/principals/${identity.principal_id}`);
        const org = await api.get<Org>(`/v1/orgs/${identity.org_id}`);
        setAuth(token, agent, principal, org);
      } catch (error) {
        console.error('[Auth] Identity verification failed:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, [token, setAuth, clearAuth]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, logout: clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
