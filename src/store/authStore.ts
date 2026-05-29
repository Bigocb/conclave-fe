import { create } from 'zustand';
import { Agent, Principal, Org } from '../types/api';

interface AuthState {
  token: string | null;
  agent: Agent | null;
  principal: Principal | null;
  org: Org | null;
  isAuthenticated: boolean;
  setAuth: (token: string, agent: Agent, principal: Principal, org: Org) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('clv_token'),
  agent: null,
  principal: null,
  org: null,
  isAuthenticated: !!localStorage.getItem('clv_token'),
  
  setAuth: (token, agent, principal, org) => {
    localStorage.setItem('clv_token', token);
    set({ token, agent, principal, org, isAuthenticated: true });
  },
  
  clearAuth: () => {
    localStorage.removeItem('clv_token');
    set({ token: null, agent: null, principal: null, org: null, isAuthenticated: false });
  },
}));
