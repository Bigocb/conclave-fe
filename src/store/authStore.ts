import { create } from 'zustand';
import type { Agent, Principal, Org, User } from '../types/api';

interface AuthState {
  token: string | null;
  user: User | null;
  agent: Agent | null;
  principal: Principal | null;
  org: Org | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User, agent?: Agent, principal?: Principal, org?: Org) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('clv_token'),
  user: null,
  agent: null,
  principal: null,
  org: null,
  isAuthenticated: !!localStorage.getItem('clv_token'),
  
  setAuth: (token, user, agent = null, principal = null, org = null) => {
    localStorage.setItem('clv_token', token);
    set({ token, user, agent, principal, org, isAuthenticated: true });
  },
  
  clearAuth: () => {
    localStorage.removeItem('clv_token');
    set({ token: null, user: null, agent: null, principal: null, org: null, isAuthenticated: false });
  },
}));
