import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Agent, Principal, Org } from '../types/api';

export function useAuth() {
  const { token, setAuth, clearAuth, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Set token in api client for initial check
        api.setToken(token);
        
        // Verify identity via the agent's "me" endpoint
        // We expect the backend to return the resolved identity
        const identity = await api.get<{ agent_id: string, principal_id: string, org_id: string }>('/v1/agents/me');
        
        // Fetch full details to populate store
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

  return {
    isAuthenticated,
    isLoading,
    user: { agent: useAuthStore.getState().agent, principal: useAuthStore.getState().principal, org: useAuthStore.getState().org },
    logout: clearAuth
  };
}
