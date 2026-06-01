import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useQueryClient } from '@tanstack/react-query';

interface PulseEvent {
  event: string;
  data: any;
}

interface PulseContextType {
  status: 'connected' | 'connecting' | 'disconnected';
  lastEvent: PulseEvent | null;
  eventCount: number;
}

const PulseContext = createContext<PulseContextType | undefined>(undefined);

export function PulseProvider({ children }: { children: React.ReactNode }) {
  const { org } = useAuthStore();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastEvent, setLastEvent] = useState<PulseEvent | null>(null);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    if (!org?.id) return;

    // SSE requires persistent connection — connect to Render (not Vercel serverless)
    // Pass token as query param since EventSource can't set Authorization headers
    const token = localStorage.getItem('access_token') || '';
    const eventSource = new EventSource(`https://conclave-bp4o.onrender.com/pulse?token=${encodeURIComponent(token)}&orgId=${org.id}`);

    setStatus('connecting');

    eventSource.onopen = () => {
      setStatus('connected');
      console.log('[Pulse] SSE Connection Established');
    };

    eventSource.onerror = (err) => {
      console.error('[Pulse] SSE Error:', err);
      setStatus('disconnected');
      eventSource.close();
    };

    // Generic listener for all events
    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        const pulseEvent: PulseEvent = {
          event: 'GENERIC_UPDATE', 
          data: parsedData
        };

        setLastEvent(pulseEvent);
        setEventCount(prev => prev + 1);

        // --- SURGICAL UPDATES ---
        // Map specific event types to TanStack Query invalidations
        const eventType = parsedData.event || 'UNKNOWN';

        switch (eventType) {
          case 'TASK_UPDATE':
          case 'REVIEW_SUBMITTED':
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            break;
          case 'BUDGET_CHANGED':
            queryClient.invalidateQueries({ queryKey: ['principals'] });
            break;
          case 'AGENT_REGISTERED':
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            break;
        }
      } catch (e) {
        console.error('[Pulse] Failed to parse event data:', e);
      }
    };

    return () => {
      eventSource.close();
      setStatus('disconnected');
    };
  }, [org?.id, queryClient]);

  return (
    <PulseContext.Provider value={{ status, lastEvent, eventCount }}>
      {children}
    </PulseContext.Provider>
  );
}

export function usePulse() {
  const context = useContext(PulseContext);
  if (context === undefined) {
    throw new Error('usePulse must be used within a PulseProvider');
  }
  return context;
}