import React, { useEffect, useState, createContext, useContext } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { Agent, Principal, Org, User } from '../types/api';

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
        
        // First, try to get the identity. 
        // Note: We need to know if this is a User token or an Agent token.
        const identity = await api.get<{ agent_id: string, principal_id: string, org_id: string }>('/v1/agents/me');
        
        // If we reach here, it's an Agent token.
        const agent = await api.get<Agent>(`/v1/agents/${identity.agent_id}`);
        const principal = await api.get<Principal>(`/v1/principals/${identity.principal_id}`);
        const org = await api.get<Org>(`/v1/orgs/${identity.org_id}`);
        
        // Create a synthetic user record for the agent session
        const syntheticUser: User = {
          id: identity.agent_id,
          email: `agent-${identity.agent_id}@conclave.local`,
          name: agent.name,
          org_id: identity.org_id,
          isAdmin: false
        };

        setAuth(token, syntheticUser, agent, principal, org);
      } catch (error) {
        console.error('[Auth] Identity verification failed:', error);
        // If it's a User token, /v1/agents/me might fail, but the session is still valid.
        // For now, if we can't verify the identity, we'll clear it.
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
