import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Button } from '../ui/core';
import { usePulse } from '../../hooks/usePulse';
import type {
  Opinion,
  OpinionStatus,
  BlackboardNode,
  BlackboardEdge,
} from '../../types/api';

const NODE_ICONS: Record<string, string> = {
  proposal: '\uD83D\uDCCB',
  critique: '\uD83D\uDCAC',
  synthesis: '\uD83D\uDD04',
  consensus: '\u2713',
};

const NODE_ICON_LABEL: Record<string, string> = {
  proposal: 'Proposal',
  critique: 'Critique',
  synthesis: 'Synthesis',
  consensus: 'Consensus',
};

const NODE_ICON_CLASS: Record<string, string> = {
  proposal: 'bg-noc-amber/20 border-noc-amber/40 text-noc-amber',
  critique: 'bg-noc-cyan/20 border-noc-cyan/40 text-noc-cyan',
  synthesis: 'bg-noc-purple/20 border-noc-purple/40 text-noc-purple',
  consensus: 'bg-noc-green/20 border-noc-green/40 text-noc-green',
};

// ─── Sub-components ──────────────────────────────────────

function StatusBanner({ status, nodeCount }: { status: OpinionStatus; nodeCount: number }) {
  const BANNERS: Record<OpinionStatus, { label: string; color: string; icon: string }> = {
    open: { label: 'Awaiting critics...', color: 'text-noc-amber border-noc-amber/30 bg-noc-amber/5', icon: '\u23F3' },
    critiquing: { label: 'Critiques in progress...', color: 'text-noc-cyan border-noc-cyan/30 bg-noc-cyan/5', icon: '\uD83D\uDCAC' },
    synthesizing: { label: 'Awaiting synthesis from asker...', color: 'text-noc-purple border-noc-purple/30 bg-noc-purple/5', icon: '\uD83D\uDD04' },
    voting: { label: 'Voting in progress...', color: 'text-noc-amber border-noc-amber/30 bg-noc-amber/5', icon: '\uD83D\uDDF3' },
    consensus_reached: { label: 'Consensus reached!', color: 'text-noc-green border-noc-green/30 bg-noc-green/5', icon: '\u2713' },
    consensus_not_reached: { label: 'Consensus not reached', color: 'text-noc-rose border-noc-rose/30 bg-noc-rose/5', icon: '\u2717' },
    closed: { label: 'Closed', color: 'text-noc-text3 border-noc-text3/30 bg-noc-text3/5', icon: '\u23F8' },
  };

  const b = BANNERS[status] || BANNERS.open;
  return (
    <div className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 mb-4 ${b.color}`} role="status" aria-label={b.label}>
      <span aria-hidden="true">{b.icon}</span>
      <span>{b.label}</span>
      <span className="text-[10px] ml-auto opacity-60">{nodeCount} node{nodeCount !== 1 ? 's' : ''}</span>
    </div>
  );
}

function CritiqueDetail({ payload }: { payload: Record<string, any> }) {
  return (
    <>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {payload.severity && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-noc-rose/10 text-noc-rose border border-noc-rose/20">
            {payload.severity}
          </span>
        )}
        {payload.flaw_count && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-noc-amber/10 text-noc-amber border border-noc-amber/20">
            {payload.flaw_count} flaws
          </span>
        )}
        {payload.confidence && !payload.approved && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-noc-cyan/10 text-noc-cyan border border-noc-cyan/20">
            {(payload.confidence * 100).toFixed(0)}% confidence
          </span>
        )}
      </div>
      {payload.recommendation && (
        <div className="mt-2 text-xs text-noc-text2 italic border-l-2 border-noc-text3/30 pl-3">
          {payload.recommendation}
        </div>
      )}
    </>
  );
}

function ConsensusDetail({ payload }: { payload: Record<string, any> }) {
  const approved = payload.approved === true;
  return (
    <div className="mt-2">
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${approved ? 'bg-noc-green/10 text-noc-green border border-noc-green/30' : 'bg-noc-rose/10 text-noc-rose border border-noc-rose/30'}`}>
        {approved ? '\u2713 Approved' : '\u2717 Rejected'}
        {payload.confidence ? ` (${(payload.confidence * 100).toFixed(0)}%)` : ''}
      </span>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function formatFullDate(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function nodeMessage(node: BlackboardNode): string {
  const p = node.payload || {};
  if (p.narrative?.message) return p.narrative.message;
  if (p.message) return p.message;
  if (p.question) return p.question;
  if (p.response) return p.response;
  if (typeof p.approved === 'boolean') return p.approved ? 'Approved' : 'Rejected';
  // Log unrecognized shapes to catch API contract drift
  if (Object.keys(p).length > 0) {
    console.warn(`[OpinionThread] Unrecognized payload shape for node ${node.id} (${node.kind}):`, Object.keys(p));
  }
  return '';
}

function shortAgentId(id: string): string {
  if (!id) return 'unknown';
  return id.length > 12 ? id.slice(0, 12) + '\u2026' : id;
}

// ─── Props ───────────────────────────────────────────────

interface OpinionThreadProps {
  opinion: Opinion;
  nodes: BlackboardNode[];
  edges: BlackboardEdge[];
}

// ─── Component ──────────────────────────────────────────

export default function OpinionThread({ opinion, nodes, edges: _edges }: OpinionThreadProps) {
  const queryClient = useQueryClient();
  const { lastEvent, eventCount } = usePulse();
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const prevNodeCount = useRef(nodes.length);

  // Sort nodes chronologically
  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [nodes]);

  // Check if user is near the bottom of the scroll container
  const isNearBottom = useCallback(() => {
    if (!listRef.current) return false;
    const el = listRef.current;
    const threshold = 100; // px from bottom
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  // Auto-scroll when new nodes arrive — only if user is near bottom
  useEffect(() => {
    if (nodes.length > prevNodeCount.current && isNearBottom()) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevNodeCount.current = nodes.length;
  }, [nodes.length, isNearBottom]);

  // Auto-scroll on Pulse SSE updates
  useEffect(() => {
    if ((lastEvent?.data?.opinionId === opinion.id || lastEvent?.data?.opinion_id === opinion.id) && isNearBottom()) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [eventCount, opinion.id, lastEvent, isNearBottom]);

  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      const lastSynthesis = [...nodes]
        .filter(n => n.kind === 'synthesis')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      const lastCritique = [...nodes]
        .filter(n => n.kind === 'critique')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      const payload: any = {
        kind: 'synthesis',
        content: { message: content, summary: 'Synthesis response', tone: 'neutral' },
      };

      if (lastSynthesis) {
        payload.parent_node_id = lastSynthesis.id;
        payload.parent_edge_kind = 'addresses';
      } else if (lastCritique) {
        payload.parent_node_id = lastCritique.id;
        payload.parent_edge_kind = 'addresses';
      }

      return api.post(`/v1/opinions/${opinion.id}/nodes`, payload);
    },
    onSuccess: () => {
      setReplyText('');
      setIsSubmitting(false);
      setSubmitError(null);
      queryClient.invalidateQueries({ queryKey: ['opinion-graph', opinion.id] });
      queryClient.invalidateQueries({ queryKey: ['opinions'] });
    },
    onError: (err: any) => {
      setIsSubmitting(false);
      setSubmitError(err?.message || 'Failed to send reply. Please try again.');
    },
  });

  const handleReply = () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    setSubmitError(null);
    replyMutation.mutate(trimmed);
  };

  const canReply = opinion.status === 'synthesizing' || opinion.status === 'open' || opinion.status === 'critiquing';

  return (
    <div className="flex flex-col h-full">
      {/* Status Banner */}
      <StatusBanner status={opinion.status} nodeCount={nodes.length} />

      {/* Message List */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto space-y-3 min-h-0 mb-4 scrollbar-thin"
        style={{ maxHeight: '420px' }}
      >
        {sortedNodes.length === 0 ? (
          <div className="h-48 flex items-center justify-center border border-dashed border-noc-border rounded-xl">
            <div className="text-center">
              <p className="text-noc-text2 mono text-xs uppercase italic tracking-widest">No contributions yet</p>
              <p className="text-noc-text3 text-[10px] mt-1">Start the conversation</p>
            </div>
          </div>
        ) : (
          sortedNodes.map((node, idx) => {
            const isLast = idx === sortedNodes.length - 1;
            const msg = nodeMessage(node);
            const time = formatTimestamp(node.created_at);
            const fullTime = formatFullDate(node.created_at);
            const agentShort = shortAgentId(node.agent_id);

            return (
              <div
                key={node.id}
                ref={isLast ? listEndRef : null}
                className="flex gap-3 animate-in slide-in-from-bottom-2 duration-300"
              >
                {/* Node type icon */}
                <div
                  className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-full border text-sm ${NODE_ICON_CLASS[node.kind] || 'bg-noc-text3/10 border-noc-text3/30 text-noc-text3'}`}
                  role="img"
                  aria-label={NODE_ICON_LABEL[node.kind] || node.kind}
                >
                  {NODE_ICONS[node.kind] || '\u25C6'}
                </div>

                {/* Message content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold text-noc-text2">
                      {agentShort}
                    </span>
                    <span
                      className={`text-[9px] mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        node.kind === 'proposal' ? 'text-noc-amber bg-noc-amber/10' :
                        node.kind === 'critique' ? 'text-noc-cyan bg-noc-cyan/10' :
                        node.kind === 'synthesis' ? 'text-noc-purple bg-noc-purple/10' :
                        'text-noc-green bg-noc-green/10'
                      }`}
                    >
                      {node.kind}
                    </span>
                    <span className="text-[10px] text-noc-text3 ml-auto" title={fullTime}>
                      {time}
                    </span>
                  </div>

                  {/* Message text */}
                  {msg ? (
                    <p className="text-sm text-noc-text1 whitespace-pre-wrap break-words">
                      {msg}
                    </p>
                  ) : (
                    <pre className="text-xs text-noc-text2 font-mono whitespace-pre-wrap bg-noc-bg3/50 rounded-lg p-2 border border-noc-border/50">
                      {JSON.stringify(node.payload, null, 2)}
                    </pre>
                  )}

                  {/* Critique detail */}
                  {node.kind === 'critique' && node.payload && <CritiqueDetail payload={node.payload} />}

                  {/* Consensus detail */}
                  {node.kind === 'consensus' && node.payload && <ConsensusDetail payload={node.payload} />}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply Input */}
      {canReply && (
        <div className="border-t border-noc-border pt-4 mt-auto shrink-0">
          <div className="flex gap-2">
            <textarea
              value={replyText}
              onChange={(e) => { setReplyText(e.target.value); setSubmitError(null); }}
              placeholder="Write a synthesis response..."
              rows={2}
              className="flex-1 bg-noc-bg3 border border-noc-border rounded-lg p-3 text-sm text-noc-text1 focus:outline-none focus:border-noc-green transition-colors resize-none font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
              }}
            />
            <div className="flex flex-col justify-end gap-1">
              <Button
                onClick={handleReply}
                disabled={!replyText.trim() || isSubmitting}
                className="whitespace-nowrap"
              >
                {isSubmitting ? 'SENDING...' : 'REPLY'}
              </Button>
            </div>
          </div>
          {submitError && (
            <p className="text-[10px] text-noc-rose mt-1 font-bold">{submitError}</p>
          )}
          <p className="text-[9px] text-noc-text3 mt-1 mono">
            Enter to send \xB7 Shift+Enter for newline \xB7 Produces a Synthesis node
          </p>
        </div>
      )}

      {/* Terminal states */}
      {!canReply && opinion.status === 'consensus_reached' && (
        <div className="border-t border-noc-border pt-4 mt-auto shrink-0 text-center">
          <p className="text-xs text-noc-green font-bold">\u2713 Thread resolved</p>
        </div>
      )}
      {!canReply && opinion.status === 'consensus_not_reached' && (
        <div className="border-t border-noc-border pt-4 mt-auto shrink-0 text-center">
          <p className="text-xs text-noc-rose font-bold">\u2717 No consensus reached</p>
        </div>
      )}
      {!canReply && opinion.status === 'closed' && (
        <div className="border-t border-noc-border pt-4 mt-auto shrink-0 text-center">
          <p className="text-xs text-noc-text3 font-bold">\u23F8 Thread closed</p>
        </div>
      )}
    </div>
  );
}