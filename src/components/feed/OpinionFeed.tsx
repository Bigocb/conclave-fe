import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Modal, Button } from '../ui/core';
import { MessageSquareText } from 'lucide-react';
import OpinionThread from './OpinionThread';
import BlackboardView from './BlackboardView';
import type { Opinion, OpinionStatus, BlackboardNode, BlackboardEdge } from '../../types/api';

const STATUS_COLORS: Record<OpinionStatus, string> = {
  open: 'text-noc-amber',
  critiquing: 'text-noc-cyan',
  synthesizing: 'text-noc-purple',
  voting: 'text-noc-amber',
  consensus_reached: 'text-noc-green',
  consensus_not_reached: 'text-noc-rose',
  closed: 'text-noc-text3',
};

const STATUS_BG: Record<OpinionStatus, string> = {
  open: 'bg-noc-amber/10 border-noc-amber/30',
  critiquing: 'bg-noc-cyan/10 border-noc-cyan/30',
  synthesizing: 'bg-noc-purple/10 border-noc-purple/30',
  voting: 'bg-noc-amber/10 border-noc-amber/30',
  consensus_reached: 'bg-noc-green/10 border-noc-green/30',
  consensus_not_reached: 'bg-noc-rose/10 border-noc-rose/30',
  closed: 'bg-noc-text3/10 border-noc-text3/30',
};

const STATUS_LABELS: Record<OpinionStatus, string> = {
  open: 'Open',
  critiquing: 'Critiquing',
  synthesizing: 'Synthesizing',
  voting: 'Voting',
  consensus_reached: 'Consensus',
  consensus_not_reached: 'Not Reached',
  closed: 'Closed',
};

/** Accessible status badge using aria-label instead of bare emoji */
function StatusBadge({ status }: { status: OpinionStatus }) {
  const a11yLabel: Record<OpinionStatus, string> = {
    open: 'Status: Open',
    critiquing: 'Status: Critiquing',
    synthesizing: 'Status: Synthesizing',
    voting: 'Status: Voting',
    consensus_reached: 'Status: Consensus reached',
    consensus_not_reached: 'Status: Consensus not reached',
    closed: 'Status: Closed',
  };

  const icon: Record<OpinionStatus, string> = {
    open: '',
    critiquing: '',
    synthesizing: '',
    voting: '',
    consensus_reached: '\u2713',
    consensus_not_reached: '\u2717',
    closed: '',
  };

  return (
    <span
      role="status"
      aria-label={a11yLabel[status] || `Status: ${status}`}
      className={`text-[10px] mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_BG[status] || 'bg-noc-text3/10 border-noc-text3/30'} ${STATUS_COLORS[status] || 'text-noc-text3'}`}
    >
      {icon[status] && <span aria-hidden="true">{icon[status]} </span>}
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function formatTime(ts: string | undefined | null): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function truncate(s: string, max: number): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max) + '\u2026' : s;
}

type DetailTab = 'conversation' | 'blackboard';

export default function OpinionFeed() {
  const queryClient = useQueryClient();
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [selectedOpinion, setSelectedOpinion] = useState<Opinion | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('conversation');
  const [askError, setAskError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['opinions'],
    queryFn: async () => {
      const res = await api.get<any>('/v1/opinions');
      const opinions = res?.opinions || res?.data?.opinions || [];
      return opinions as Opinion[];
    }
  });

  const { data: graphData, isLoading: loadingGraph } = useQuery({
    queryKey: ['opinion-graph', selectedOpinion?.id],
    queryFn: async () => {
      if (!selectedOpinion) return null;
      const res = await api.get<any>(`/v1/opinions/${selectedOpinion.id}/graph`);
      return (res || { nodes: [], edges: [] }) as { nodes: BlackboardNode[]; edges: BlackboardEdge[] };
    },
    enabled: !!selectedOpinion && isDetailOpen,
  });

  const askMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/opinions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opinions'] });
      setIsAskOpen(false);
      setAskError(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to create opinion.';
      setAskError(msg);
    }
  });

  const grantBudgetMutation = useMutation({
    mutationFn: (amount: number) => api.post(`/v1/principals/${selectedPrincipalId}/budget/grant`, { amount, reason: 'manual grant from UI' }),
    onSuccess: () => {
      setAskError(null);
      queryClient.invalidateQueries({ queryKey: ['principals'] });
    }
  });

  const openDetail = (opinion: Opinion) => {
    setSelectedOpinion(opinion);
    setIsDetailOpen(true);
    setDetailTab('conversation');
  };

  const opinions = data || [];

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center border border-noc-border rounded-3xl bg-noc-bg2/40">
        <div className="w-6 h-6 border-2 border-noc-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-noc-rose mono text-xs uppercase font-bold">
        Feed Error: {(error as any).message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold mono text-noc-text1 uppercase tracking-tighter">Opinion Feed</h1>
          <p className="text-xs mono text-noc-text2">Fleet-wide agent queries and discussions</p>
        </div>
        <Button onClick={() => setIsAskOpen(true)} className="flex items-center gap-2">
          <MessageSquareText size={16} />
          <span className="text-xs mono">ASK OPINION</span>
        </Button>
      </div>

      {/* Empty state */}
      {opinions.length === 0 ? (
        <div className="h-64 flex items-center justify-center border border-dashed border-noc-border rounded-3xl bg-black/20">
          <div className="text-center">
            <p className="text-noc-text2 mono text-xs uppercase italic tracking-widest">No opinions yet</p>
            <div className="mt-4 w-48 h-1 bg-noc-border overflow-hidden rounded-full mx-auto">
              <div className="h-full bg-noc-green animate-progress" style={{ width: '20%' }} />
            </div>
          </div>
        </div>
      ) : (
        /* Opinion list */
        <div className="space-y-3">
          {opinions.map((opinion: Opinion) => (
            <div
              key={opinion.id}
              onClick={() => openDetail(opinion)}
              className="p-4 bg-noc-bg2 border border-noc-border rounded-xl hover:border-noc-green/50 transition-all cursor-pointer group overflow-hidden"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono text-noc-text3 truncate">{opinion.id}</span>
                </div>
                <StatusBadge status={opinion.status} />
              </div>
              <div className="text-sm mb-2 text-noc-text1 line-clamp-2 break-words font-medium">
                {truncate(opinion.question, 300)}
              </div>
              {opinion.context && (
                <div className="text-xs text-noc-text3 mb-2 line-clamp-1 italic">
                  {truncate(opinion.context, 150)}
                </div>
              )}
              <div className="flex justify-between items-center text-[10px] text-noc-text3">
                <span className="truncate">Channel: {opinion.channel || '-'}</span>
                <span className="shrink-0 ml-2">
                  {opinion.requested_opinions 
                    ? `Requested: ${opinion.requested_opinions}` 
                    : `Created ${formatTime(opinion.created_at)}`
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal with Tab Switcher */}
      <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedOpinion(null); }} title="Opinion Thread">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 mb-4 p-0.5 bg-noc-bg3/60 border border-noc-border rounded-lg w-fit">
          <button
            onClick={() => setDetailTab('conversation')}
            className={`px-4 py-1.5 rounded-md text-[10px] mono font-bold uppercase transition-all ${
              detailTab === 'conversation'
                ? 'bg-noc-green/15 text-noc-green border border-noc-green/30'
                : 'text-noc-text3 hover:text-noc-text2 border border-transparent'
            }`}
          >
            💬 Conversation
          </button>
          <button
            onClick={() => setDetailTab('blackboard')}
            className={`px-4 py-1.5 rounded-md text-[10px] mono font-bold uppercase transition-all ${
              detailTab === 'blackboard'
                ? 'bg-noc-green/15 text-noc-green border border-noc-green/30'
                : 'text-noc-text3 hover:text-noc-text2 border border-transparent'
            }`}
          >
            📋 Blackboard
          </button>
        </div>

        {/* Content */}
        {loadingGraph ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-noc-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : selectedOpinion && graphData ? (
          detailTab === 'conversation' ? (
            <OpinionThread
              opinion={selectedOpinion}
              nodes={graphData.nodes}
              edges={graphData.edges}
            />
          ) : (
            <BlackboardView
              opinion={selectedOpinion}
              nodes={graphData.nodes}
              edges={graphData.edges}
            />
          )
        ) : selectedOpinion ? (
          <OpinionThread
            opinion={selectedOpinion}
            nodes={[]}
            edges={[]}
          />
        ) : null}
      </Modal>

      {/* Ask Opinion Modal */}
      <Modal isOpen={isAskOpen} onClose={() => { setIsAskOpen(false); setAskError(null); }} title="Ask the Fleet">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setAskError(null);
            const fd = new FormData(e.currentTarget);
            const question = (fd.get('question') as string || '').trim();
            if (question.length < 10) {
              setAskError('Question must be at least 10 characters');
              return;
            }
            const payload: any = {
              question,
              channel: fd.get('channel'),
              requested_opinions: parseInt(fd.get('requested_opinions') as string) || 3,
            };
            const context = (fd.get('context') as string || '').trim();
            if (context) payload.context = context;
            askMutation.mutate(payload);
          }}
        >
          {askError && (
            <div className="p-3 bg-noc-rose/10 border border-noc-rose/30 rounded-xl">
              <p className="text-xs text-noc-rose font-bold">{askError}</p>
            </div>
          )}
          <div>
            <label className="block text-xs mono text-noc-text3 uppercase mb-1">Question</label>
            <textarea name="question" required minLength={10} rows={3} className="w-full bg-noc-bg3 border border-noc-border p-3 rounded-lg text-noc-text1 focus:border-noc-green outline-none transition-all text-sm" placeholder="What do you want the fleet to weigh in on? (min 10 chars)" />
          </div>
          <div>
            <label className="block text-xs mono text-noc-text3 uppercase mb-1">Context (optional)</label>
            <textarea name="context" rows={2} className="w-full bg-noc-bg3 border border-noc-border p-3 rounded-lg text-noc-text1 focus:border-noc-green outline-none transition-all text-sm" placeholder="Background information for the fleet..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mono text-noc-text3 uppercase mb-1">Channel</label>
              <select name="channel" required className="w-full bg-noc-bg3 border border-noc-border p-3 rounded-lg text-noc-text1 focus:border-noc-green outline-none transition-all text-sm">
                <option value="code-review">code-review</option>
                <option value="architecture">architecture</option>
                <option value="general-qa">general-qa</option>
                <option value="fact-check">fact-check</option>
                <option value="security-review">security-review</option>
                <option value="creative">creative</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mono text-noc-text3 uppercase mb-1">Requested Opinions</label>
              <input name="requested_opinions" type="number" defaultValue={3} min={1} max={10} className="w-full bg-noc-bg3 border border-noc-border p-3 rounded-lg text-noc-text1 focus:border-noc-green outline-none transition-all text-sm" />
            </div>
          </div>
          <Button type="submit" disabled={askMutation.isPending} className="w-full py-3">
            {askMutation.isPending ? 'SUBMITTING...' : 'ASK THE FLEET'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}