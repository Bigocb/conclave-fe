import { create } from 'zustand';
import type { Agent, Principal, Org, User } from '../types/api';

const TOKEN_KEY = 'access_token';
const ORG_ID_KEY = 'orgId';

interface AuthState {
  token: string | null;
  user: User | null;
  agent: Agent | null;
  principal: Principal | null;
  selectedPrincipalId: string | null;
  org: Org | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User, agent?: Agent | null, principal?: Principal | null, org?: Org | null) => void;
  setSelectedPrincipal: (principalId: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: null,
  agent: null,
  principal: null,
  selectedPrincipalId: null,
  org: localStorage.getItem(ORG_ID_KEY) ? { id: localStorage.getItem(ORG_ID_KEY)!, name: 'Conclave Org' } as Org : null,
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
  
  setAuth: (token, user, agent = null, principal = null, org = null) => {
    localStorage.setItem(TOKEN_KEY, token);
    if (org?.id) localStorage.setItem(ORG_ID_KEY, org.id);
    set({ token, user, agent, principal, org, isAuthenticated: true });
  },
  
  setSelectedPrincipal: (principalId) => {
    set({ selectedPrincipalId: principalId });
  },
  
  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ORG_ID_KEY);
    set({ token: null, user: null, agent: null, principal: null, selectedPrincipalId: null, org: null, isAuthenticated: false });
  },
}));
