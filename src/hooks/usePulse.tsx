import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
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

const PULSE_URL = 'https://conclave-bp4o.onrender.com/pulse';
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

export function PulseProvider({ children }: { children: React.ReactNode }) {
  const { org } = useAuthStore();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastEvent, setLastEvent] = useState<PulseEvent | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const retryCountRef = useRef(0);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!org?.id) return;

    const token = localStorage.getItem('access_token') || '';
    if (!token) {
      console.warn('[Pulse] No access_token in localStorage — skipping SSE connection');
      return;
    }

    const url = `${PULSE_URL}?token=${encodeURIComponent(token)}&orgId=${org.id}`;
    console.log('[Pulse] Connecting to', PULSE_URL, 'for org', org.id);
    setStatus('connecting');

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      console.log('[Pulse] SSE Connection Established');
      setStatus('connected');
      retryCountRef.current = 0; // reset retries on successful connect
    };

    es.onerror = () => {
      console.error('[Pulse] SSE error — readyState:', es.readyState);
      es.close();
      esRef.current = null;

      // EventSource readyState 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
      // If we never got onopen, it's likely a 401 (bad token) or network error
      if (retryCountRef.current === 0 && status !== 'connected') {
        // First attempt failed — likely auth issue. Clear stale token.
        console.warn('[Pulse] Initial connection failed — clearing stale token and reloading');
        localStorage.removeItem('access_token');
        localStorage.removeItem('orgId');
        setStatus('disconnected');
        window.location.reload();
        return;
      }

      setStatus('disconnected');

      // Exponential backoff reconnection
      if (retryCountRef.current < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, retryCountRef.current);
        retryCountRef.current++;
        console.log(`[Pulse] Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
        reconnectTimerRef.current = setTimeout(connect, delay);
      } else {
        console.error('[Pulse] Max retries reached — giving up. Reload page to retry.');
      }
    };

    es.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        const pulseEvent: PulseEvent = {
          event: 'GENERIC_UPDATE',
          data: parsedData
        };

        setLastEvent(pulseEvent);
        setEventCount(prev => prev + 1);

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
  }, [org?.id, queryClient, status]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      setStatus('disconnected');
    };
  }, [connect]);

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