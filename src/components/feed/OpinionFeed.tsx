import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Modal, Button } from '../ui/core';
import { MessageSquareText } from 'lucide-react';
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
  consensus_reached: '✅ Consensus',
  consensus_not_reached: '⛔ Not Reached',
  closed: 'Closed',
};

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

export default function OpinionFeed() {
  const queryClient = useQueryClient();
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [selectedOpinion, setSelectedOpinion] = useState<Opinion | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailGraph, setDetailGraph] = useState<{ nodes: BlackboardNode[]; edges: BlackboardEdge[] } | null>(null);
  const [loadingGraph, setLoadingGraph] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['opinions'],
    queryFn: async () => {
      const res = await api.get<any>('/v1/opinions');
      const opinions = res?.opinions || res?.data?.opinions || [];
      return opinions as Opinion[];
    }
  });

  const askMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/opinions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opinions'] });
      setIsAskOpen(false);
    }
  });

  const openDetail = async (opinion: Opinion) => {
    setSelectedOpinion(opinion);
    setIsDetailOpen(true);
    setLoadingGraph(true);
    try {
      const res = await api.get<any>(`/v1/opinions/${opinion.id}/graph`);
      setDetailGraph(res || { nodes: [], edges: [] });
    } catch (e: any) {
      setDetailGraph(null);
    } finally {
      setLoadingGraph(false);
    }
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
                <span className={`text-[10px] mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_BG[opinion.status] || 'bg-noc-text3/10 border-noc-text3/30'} ${STATUS_COLORS[opinion.status] || 'text-noc-text3'}`}>
                  {STATUS_LABELS[opinion.status] || opinion.status}
                </span>
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

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedOpinion(null); setDetailGraph(null); }} title="Opinion Detail">
        {loadingGraph ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-noc-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : selectedOpinion && (
          <div className="space-y-6">
            {/* Status + Channel */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${STATUS_BG[selectedOpinion.status] || 'bg-noc-text3/10'} ${STATUS_COLORS[selectedOpinion.status] || 'text-noc-text3'}`}>
                {STATUS_LABELS[selectedOpinion.status] || selectedOpinion.status}
              </span>
              <span className="text-xs text-noc-text3">Channel: {selectedOpinion.channel}</span>
              {selectedOpinion.requested_opinions && (
                <span className="text-xs text-noc-text3">\xB7 {selectedOpinion.requested_opinions} requested</span>
              )}
              <span className="text-[10px] font-mono text-noc-text3 ml-auto">{selectedOpinion.id}</span>
            </div>

            {/* Question */}
            <div>
              <p className="text-[10px] font-bold text-noc-text3 uppercase tracking-wider mb-1">Question</p>
              <p className="text-sm text-noc-text1">{selectedOpinion.question}</p>
            </div>

            {/* Context */}
            {selectedOpinion.context && (
              <div>
                <p className="text-[10px] font-bold text-noc-text3 uppercase tracking-wider mb-1">Context</p>
                <p className="text-xs text-noc-text2 italic">{selectedOpinion.context}</p>
              </div>
            )}

            {/* Graph Summary */}
            {detailGraph && (
              <div className="border border-noc-border rounded-2xl p-5 bg-noc-bg2">
                <h4 className="text-xs font-bold text-noc-text3 uppercase tracking-wider mb-4">
                  Discussion Graph
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-noc-bg3 rounded-xl p-4 text-center border border-noc-border">
                    <p className="text-2xl font-bold text-noc-cyan">{detailGraph.nodes.length}</p>
                    <p className="text-[10px] text-noc-text3 uppercase tracking-wider">Nodes</p>
                  </div>
                  <div className="bg-noc-bg3 rounded-xl p-4 text-center border border-noc-border">
                    <p className="text-2xl font-bold text-noc-purple">{detailGraph.edges.length}</p>
                    <p className="text-[10px] text-noc-text3 uppercase tracking-wider">Edges</p>
                  </div>
                </div>
                {/* Node kind breakdown */}
                {detailGraph.nodes.length > 0 && (
                  <div className="space-y-1 p-3 bg-noc-bg3 rounded-xl border border-noc-border">
                    {(['proposal', 'critique', 'synthesis', 'consensus'] as const).map(kind => {
                      const count = detailGraph!.nodes.filter(n => n.kind === kind).length;
                      if (count === 0) return null;
                      return (
                        <div key={kind} className="flex justify-between items-center text-xs">
                          <span className="text-noc-text3 capitalize">{kind}</span>
                          <span className="font-bold text-noc-text1">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Consensus status */}
                {detailGraph.nodes.some(n => n.kind === 'consensus') && (
                  <div className={`mt-4 p-3 rounded-xl border text-xs font-bold text-center ${
                    detailGraph.nodes.some(n => n.kind === 'consensus' && n.payload?.approved === true)
                      ? 'bg-noc-green/10 border-noc-green/30 text-noc-green'
                      : 'bg-noc-amber/10 border-noc-amber/30 text-noc-amber'
                  }`}>
                    {detailGraph.nodes.filter(n => n.kind === 'consensus' && n.payload?.approved === true).length > 0
                      ? '\u2705 Consensus Reached'
                      : '\u23F3 Awaiting Consensus'}
                  </div>
                )}
              </div>
            )}

            {/* Meta */}
            <div className="text-xs text-noc-text3">
              Created: {new Date(selectedOpinion.created_at).toLocaleString()}
              {selectedOpinion.topology && <> \xB7 Topology: {selectedOpinion.topology}</>}
              {selectedOpinion.budget_spent > 0 && <> \xB7 Budget: {selectedOpinion.budget_spent}</>}
            </div>
          </div>
        )}
      </Modal>

      {/* Ask Opinion Modal */}
      <Modal isOpen={isAskOpen} onClose={() => setIsAskOpen(false)} title="Ask the Fleet">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const payload: any = {
              question: fd.get('question'),
              channel: fd.get('channel'),
              context: fd.get('context') || undefined,
              requested_opinions: parseInt(fd.get('requested_opinions') as string) || 3,
            };
            askMutation.mutate(payload);
          }}
        >
          <div>
            <label className="block text-xs mono text-noc-text3 uppercase mb-1">Question</label>
            <textarea name="question" required rows={3} className="w-full bg-noc-bg3 border border-noc-border p-3 rounded-lg text-noc-text1 focus:border-noc-green outline-none transition-all text-sm" placeholder="What do you want the fleet to weigh in on?" />
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