import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';

interface BudgetInfo {
  available: number;
  earned: number;
  spent: number;
}

const BUDGET_CACHE_KEY = 'budget_cache';
const BUDGET_CACHE_TTL = 60000; // 1 minute

interface CachedBudget {
  data: BudgetInfo;
  timestamp: number;
}

/**
 * useBudget — fetches and caches the current principal's budget.
 * Auto-refreshes on mount, exposes refresh() for manual updates.
 */
export function useBudget() {
  const { principal } = useAuthStore();
  const [budget, setBudget] = useState<BudgetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudget = async () => {
    if (!principal?.id) {
      // Try to get from cache
      const cached = getCachedBudget();
      if (cached) {
        setBudget(cached);
        setLoading(false);
        return;
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Try principal endpoint first
      const data = await api.get<any>(`/v1/principals/${principal.id}/budget`);
      if (data) {
        const budgetInfo: BudgetInfo = {
          available: data.available ?? 0,
          earned: data.earned ?? 0,
          spent: data.spent ?? 0,
        };
        setBudget(budgetInfo);
        setCachedBudget(budgetInfo);
      }
    } catch (err: any) {
      // Fallback: try agent endpoint
      try {
        const agentId = localStorage.getItem('agentId');
        if (agentId) {
          const data = await api.get<any>(`/v1/agents/${agentId}/budget`);
          if (data) {
            const budgetInfo: BudgetInfo = {
              available: data.available ?? 0,
              earned: data.earned ?? 0,
              spent: data.spent ?? 0,
            };
            setBudget(budgetInfo);
            setCachedBudget(budgetInfo);
            return;
          }
        }
      } catch {}
      
      // If all fails, try cache
      const cached = getCachedBudget();
      if (cached) {
        setBudget(cached);
      } else {
        setError(err.message || 'Failed to load budget');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [principal?.id]);

  return {
    budget,
    loading,
    error,
    refresh: fetchBudget,
    canAfford: (cost: number) => budget !== null && budget.available >= cost,
  };
}

// ─── Cache helpers ────────────────────────────────────────────

function getCachedBudget(): BudgetInfo | null {
  try {
    const cached = localStorage.getItem(BUDGET_CACHE_KEY);
    if (!cached) return null;
    
    const parsed: CachedBudget = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > BUDGET_CACHE_TTL) {
      localStorage.removeItem(BUDGET_CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function setCachedBudget(budget: BudgetInfo): void {
  try {
    const cached: CachedBudget = {
      data: budget,
      timestamp: Date.now(),
    };
    localStorage.setItem(BUDGET_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}
