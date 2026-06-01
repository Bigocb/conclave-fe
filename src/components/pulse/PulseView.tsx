import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';

interface PulseEvent {
  id: string;
  timestamp: string;
  type: string;
  payload: any;
  raw?: string;
}

const PULSE_COLORS: Record<string, string> = {
  TASK_CREATED: 'text-emerald-400',
  REVIEW_SUBMITTED: 'text-cyan-400',
  BUDGET_CHANGED: 'text-amber-400',
  REP_UPDATED: 'text-violet-400',
  FLEET_HEARTBEAT: 'text-zinc-600',
  FLEET_TASK_FOUND: 'text-sky-400',
  FLEET_SKIP: 'text-zinc-500',
  FLEET_REVIEW_DRAFTED: 'text-indigo-400',
  FLEET_REVIEW_SUBMITTED: 'text-emerald-400',
  OPINION_ASKED: 'text-fuchsia-400',
  OPINION_ANSWERED: 'text-pink-400',
};

const PULSE_ICONS: Record<string, string> = {
  TASK_CREATED: '⊕',
  REVIEW_SUBMITTED: '✓',
  BUDGET_CHANGED: '⟐',
  REP_UPDATED: '★',
  FLEET_HEARTBEAT: '♡',
  FLEET_TASK_FOUND: '◈',
  FLEET_SKIP: '⊘',
  FLEET_REVIEW_DRAFTED: '✎',
  FLEET_REVIEW_SUBMITTED: '✔',
  OPINION_ASKED: '?',
  OPINION_ANSWERED: '!',
};

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '--:--:--';
  }
}

function summarizePayload(type: string, payload: any): string {
  if (!payload) return '';
  switch (type) {
    case 'TASK_CREATED':
      return `#${payload.id?.slice(0, 8) ?? '?'} on ${payload.channel ?? '?'}`;
    case 'REVIEW_SUBMITTED':
      return `task:${payload.taskId?.slice(0, 8) ?? '?'}`;
    case 'BUDGET_CHANGED':
      return `${payload.principalId?.slice(0, 12) ?? '?'} → ${payload.newBalance ?? '?'}`;
    case 'REP_UPDATED':
      return `${payload.principalId?.slice(0, 12) ?? '?'} overall:${payload.overall ?? '?'}`;
    case 'FLEET_HEARTBEAT':
      return payload.reviewerName ?? 'fleet';
    case 'FLEET_TASK_FOUND':
      return `${payload.reviewerName ?? '?'} found ${payload.taskId?.slice(0, 8) ?? '?'}`;
    case 'FLEET_SKIP':
      return `${payload.taskId?.slice(0, 8) ?? '?'} — ${payload.reason ?? '?'}`;
    case 'FLEET_REVIEW_DRAFTED':
      return `${payload.reviewerName ?? '?'} → ${payload.confidence ?? '?'}%`;
    case 'FLEET_REVIEW_SUBMITTED':
      return `${payload.reviewerName ?? '?'} approved:${payload.approved ?? '?'}`;
    case 'OPINION_ASKED':
      return `${payload.question?.slice(0, 60) ?? '?'}`;
    case 'OPINION_ANSWERED':
      return `${payload.opinionId?.slice(0, 8) ?? '?'}`;
    default:
      return JSON.stringify(payload).slice(0, 80);
  }
}

export default function PulseView() {
  const { org } = useAuthStore();
  const [events, setEvents] = useState<PulseEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [paused, setPaused] = useState(false);
  const [connected, setConnected] = useState(false);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const listRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef<PulseEvent[]>([]);
  const RAF_ID = useRef<number>(0);
  const esRef = useRef<EventSource | null>(null);

  // Flush buffer to state on animation frame (batched rendering)
  const flush = useCallback(() => {
    if (bufferRef.current.length > 0) {
      const batch = bufferRef.current;
      bufferRef.current = [];
      setEvents(prev => {
        const combined = [...batch, ...prev].slice(0, 500);
        return combined;
      });
      setEventCounts(prev => {
        const next = { ...prev };
        for (const e of batch) {
          next[e.type] = (next[e.type] || 0) + 1;
        }
        return next;
      });
    }
    if (listRef.current && !paused) {
      listRef.current.scrollTop = 0;
    }
    RAF_ID.current = requestAnimationFrame(flush);
  }, [paused]);

  useEffect(() => {
    if (!org?.id) return;
    const token = localStorage.getItem('access_token') || '';
    // SSE requires persistent connection — connect to Render (not Vercel serverless)
    // Pass token as query param since EventSource can't set Authorization headers
    const url = `https://conclave-bp4o.onrender.com/pulse?token=${token}&orgId=${org.id}`;

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.addEventListener('message', (e: MessageEvent) => {
      if (paused) return;
      try {
        const data = JSON.parse(e.data);
        const event: PulseEvent = {
          id: data.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: data.timestamp || new Date().toISOString(),
          type: data.type || 'UNKNOWN',
          payload: data.payload || {},
          raw: e.data,
        };
        bufferRef.current.push(event);
      } catch {
        // heartbeat or non-JSON
      }
    });

    es.onerror = () => {
      setConnected(false);
    };

    RAF_ID.current = requestAnimationFrame(flush);

    return () => {
      es.close();
      esRef.current = null;
      cancelAnimationFrame(RAF_ID.current);
    };
  }, [org?.id, paused, flush]);

  const filtered = filter === 'all'
    ? events
    : events.filter(e => e.type === filter);

  const uniqueTypes = Array.from(new Set(events.map(e => e.type))).sort();

  const clearEvents = () => {
    setEvents([]);
    setEventCounts({});
    bufferRef.current = [];
  };

  return (
    <div className="flex flex-col h-full gap-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-noc-border bg-noc-bg2/80 backdrop-blur-md rounded-t-3xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-noc-green animate-ping' : 'bg-noc-rose'}`} />
            <span className={`text-[10px] mono uppercase font-bold ${connected ? 'text-noc-green' : 'text-noc-rose'}`}>
              {connected ? 'LIVE' : 'DISCONNECTED'}
            </span>
          </div>
          <span className="text-[10px] mono text-noc-text3 uppercase tracking-wider font-bold">
            {events.length} events · {Object.keys(eventCounts).length} types
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPaused(p => !p)}
            className={`px-3 py-1.5 text-[10px] mono uppercase font-bold border rounded-lg transition-all ${
              paused
                ? 'bg-noc-amber/10 border-noc-amber/30 text-noc-amber'
                : 'bg-white/5 border-noc-border text-noc-text2 hover:text-noc-text1'
            }`}
          >
            {paused ? '⏸ PAUSED' : '▶ LIVE'}
          </button>
          <button
            onClick={clearEvents}
            className="px-3 py-1.5 text-[10px] mono uppercase font-bold border border-noc-border rounded-lg text-noc-text2 hover:text-noc-text1 hover:bg-white/5 transition-all"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-noc-border bg-black/30 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded text-[9px] mono uppercase font-bold whitespace-nowrap transition-all ${
            filter === 'all'
              ? 'bg-noc-green/10 text-noc-green border border-noc-green/30'
              : 'text-noc-text3 border border-transparent hover:text-noc-text2'
          }`}
        >
          ALL ({events.length})
        </button>
        {uniqueTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-2.5 py-1 rounded text-[9px] mono uppercase font-bold whitespace-nowrap transition-all ${
              filter === type
                ? 'bg-noc-green/10 text-noc-green border border-noc-green/30'
                : 'text-noc-text3 border border-transparent hover:text-noc-text2'
            }`}
          >
            {type.replace(/_/g, '·')} ({eventCounts[type] || 0})
          </button>
        ))}
      </div>

      {/* Event Stream */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto bg-black/40 rounded-b-3xl border border-noc-border border-t-0 pb-4"
        style={{ scrollBehavior: paused ? 'auto' : 'smooth' }}
      >
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-noc-green rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-noc-green rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
              <div className="w-2 h-2 bg-noc-green rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
            </div>
            <p className="text-noc-text3 text-xs mono uppercase tracking-widest font-bold">
              {connected ? 'Awaiting events...' : 'Connecting to Pulse stream...'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 px-6 py-2.5 border-b border-noc-border/30 hover:bg-white/[0.02] transition-colors group animate-in slide-in-from-top-1 duration-300"
                style={{ animationDelay: '0ms' }}
              >
                {/* Icon */}
                <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full border text-xs font-bold ${PULSE_COLORS[event.type] || 'text-noc-text3'} border-current/20 bg-current/5`}>
                  {PULSE_ICONS[event.type] || '◆'}
                </div>
                {/* Timestamp */}
                <div className="text-[10px] mono text-noc-text3 w-20 flex-shrink-0 font-bold tracking-tight">
                  {formatTime(event.timestamp)}
                </div>
                {/* Type */}
                <div className={`text-[10px] mono font-bold w-28 flex-shrink-0 ${PULSE_COLORS[event.type] || 'text-noc-text2'}`}>
                  {event.type.replace(/_/g, '·')}
                </div>
                {/* Summary */}
                <div className="text-[11px] text-noc-text2 truncate flex-1 font-mono">
                  {summarizePayload(event.type, event.payload)}
                </div>
                {/* Expand detail */}
                <div className="hidden group-hover:block text-[9px] text-noc-text3 mono cursor-pointer" onClick={() => {
                  const detail = document.getElementById(`pulse-detail-${event.id}`);
                  if (detail) detail.classList.toggle('hidden');
                }}>
                  [+]
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
