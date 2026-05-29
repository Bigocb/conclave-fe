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
        
        // Try to verify if this is an Agent token
        try {
          const identity = await api.get<{ agent_id: string, principal_id: string, org_id: string }>('/v1/agents/me');
          
          if (identity) {
            const agent = await api.get<Agent>(`/v1/agents/${identity.agent_id}`);
            const principal = await api.get<Principal>(`/v1/principals/${identity.principal_id}`);
            const org = await api.get<Org>(`/v1/orgs/${identity.org_id}`);
            
            const syntheticUser: User = {
              id: identity.agent_id,
              email: `agent-${identity.agent_id}@conclave.local`,
              name: agent.name,
              org_id: identity.org_id,
              isAdmin: false
            };

            setAuth(token, syntheticUser, agent, principal, org);
          }
        } catch (agentError: any) {
          // If /v1/agents/me fails, it might be a User token.
          // We only clear auth if the error is actually a 401 Unauthorized.
          if (agentError.response?.status === 401) {
            console.log('[Auth] Token is invalid (401). Clearing session.');
            clearAuth();
          } else {
            console.log('[Auth] Not an agent session, proceeding as user session.');
            // We keep the token and isAuthenticated=true, but leave user/agent/org as null 
            // until they are fetched by the dashboard/views.
          }
        }
      } catch (error) {
        console.error('[Auth] Critical initialization error:', error);
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
