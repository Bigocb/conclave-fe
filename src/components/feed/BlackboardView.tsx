import { useState, useMemo, useRef, useEffect } from 'react';
import type { Opinion, OpinionStatus, BlackboardNode, BlackboardEdge } from '../../types/api';

// ─── Constants ──────────────────────────────────────────

const NODE_COLORS: Record<string, { bg: string; border: string; text: string; label: string; icon: string }> = {
  proposal:   { bg: 'bg-noc-amber/10', border: 'border-noc-amber/40', text: 'text-noc-amber', label: 'Proposal', icon: '\uD83D\uDCCB' },
  critique:   { bg: 'bg-noc-cyan/10',  border: 'border-noc-cyan/40',  text: 'text-noc-cyan',  label: 'Critique', icon: '\uD83D\uDCAC' },
  synthesis:  { bg: 'bg-noc-purple/10',border: 'border-noc-purple/40',text: 'text-noc-purple', label: 'Synthesis', icon: '\uD83D\uDD04' },
  consensus:  { bg: 'bg-noc-green/10', border: 'border-noc-green/40', text: 'text-noc-green', label: 'Consensus', icon: '\u2713' },
};

const EDGE_LABELS: Record<string, string> = {
  critiques:  'critiques',
  addresses:  'addresses',
  votes_on:   'votes on',
  follow_up:  'follow up',
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

// ─── Helpers ────────────────────────────────────────────

function shortId(id: string): string {
  if (!id) return '';
  return id.length > 10 ? id.slice(0, 10) + '\u2026' : id;
}

function formatTs(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

// ─── Props ──────────────────────────────────────────────

interface BlackboardViewProps {
  opinion: Opinion;
  nodes: BlackboardNode[];
  edges: BlackboardEdge[];
}

// ─── Sub-components ─────────────────────────────────────

function EdgeLabel({ label, x1, y1, x2, y2 }: { label: string; x1: number; y1: number; x2: number; y2: number }) {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(30 45 74)" strokeWidth={1.5} strokeDasharray="4 3" />
      <rect x={cx - 28} y={cy - 8} width={56} height={16} rx={4} fill="rgb(12 17 27)" />
      <text x={cx} y={cy + 3.5} textAnchor="middle" fill="rgb(85 99 119)" fontSize={8} fontFamily="ui-monospace, monospace" fontWeight="bold">
        {label}
      </text>
    </>
  );
}

function NodeCard({
  node,
  expanded,
  onToggle,
  onRef,
}: {
  node: BlackboardNode;
  expanded: boolean;
  onToggle: () => void;
  onRef: (el: HTMLDivElement | null) => void;
}) {
  const c = NODE_COLORS[node.kind] || NODE_COLORS.proposal;
  const p = node.payload || {};

  return (
    <div
      ref={onRef}
      className={`${c.bg} ${c.border} border rounded-xl p-3 min-w-[200px] max-w-[260px] cursor-pointer hover:brightness-110 transition-all`}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs" aria-hidden="true">{c.icon}</span>
        <span className={`text-[9px] mono font-bold px-1.5 py-0.5 rounded uppercase ${c.bg} ${c.text} border ${c.border}`}>
          {c.label}
        </span>
        <span className="text-[8px] font-mono text-noc-text3 ml-auto">{shortId(node.agent_id)}</span>
      </div>

      {/* Author + time */}
      <div className="flex items-center gap-2 text-[9px] text-noc-text3 mb-1">
        <span className="font-mono">{shortId(node.id)}</span>
        <span>{formatTs(node.created_at)}</span>
      </div>

      {/* Structured summary */}
      {node.kind === 'critique' && (
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex flex-wrap gap-1">
            {p.confidence !== undefined && <StatBadge label={`${(typeof p.confidence === 'number' ? p.confidence * 100 : parseInt(p.confidence, 10)).toFixed(0)}%`} color="noc-cyan" />}
            {p.is_follow_up && <StatBadge label="follow-up" color="noc-purple" />}
          </div>
          {p.reasoning && (
            <div className="text-[10px] text-noc-text2 italic line-clamp-2">
              {p.reasoning}
            </div>
          )}
          {Array.isArray(p.concerns) && p.concerns.length > 0 && (
            <div className="text-[9px] text-noc-text3">
              {p.concerns.length} concern{p.concerns.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {node.kind === 'consensus' && (
        <div className="mt-1">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${p.approved ? 'bg-noc-green/10 text-noc-green border border-noc-green/30' : 'bg-noc-rose/10 text-noc-rose border border-noc-rose/30'}`}>
            {p.approved ? '\u2713 Approved' : '\u2717 Rejected'}
            {p.confidence ? ` (${(p.confidence * 100).toFixed(0)}%)` : ''}
          </span>
        </div>
      )}

      {node.kind === 'proposal' && (
        <div className="text-[10px] text-noc-text1 line-clamp-2 mt-1">
          {p.question || p.narrative?.message || p.message || ''}
        </div>
      )}

      {node.kind === 'synthesis' && (
        <div className="text-[10px] text-noc-text1 line-clamp-2 mt-1">
          {p.message || p.narrative?.message || p.summary || ''}
        </div>
      )}

      {/* Expandable payload */}
      {expanded && (
        <pre className="mt-2 text-[9px] text-noc-text2 font-mono whitespace-pre-wrap bg-noc-bg/80 rounded-lg p-2 border border-noc-border/50 max-h-[200px] overflow-auto">
          {JSON.stringify(p, null, 2)}
        </pre>
      )}
    </div>
  );
}

function StatBadge({ label, color }: { label: string; color: string }) {
  return <span className={`text-[8px] px-1.5 py-0.5 rounded-full border bg-${color}/10 text-${color} border-${color}/30`}>{label}</span>;
}

// ─── Main Component ─────────────────────────────────────

export default function BlackboardView({ opinion, nodes, edges }: BlackboardViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [lines, setLines] = useState<{ from: { x: number; y: number }; to: { x: number; y: number }; label: string }[]>([]);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setNodeRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else nodeRefs.current.delete(id);
  };

  // Build layers: proposal → critiques → synthesis → consensus
  const layers = useMemo(() => {
    const proposal = nodes.filter(n => n.kind === 'proposal');
    const critiques = nodes.filter(n => n.kind === 'critique');
    const syntheses = nodes.filter(n => n.kind === 'synthesis');
    const consensus = nodes.filter(n => n.kind === 'consensus');
    return { proposal, critiques, syntheses, consensus };
  }, [nodes]);

  // Determine which edges connect which layers
  // (used by SVG line overlay via the useEffect below)

  // Compute SVG lines after layout settles
  useEffect(() => {
    const timer = setTimeout(() => {
      const computedLines: { from: { x: number; y: number }; to: { x: number; y: number }; label: string }[] = [];

      for (const edge of edges) {
        const fromEl = nodeRefs.current.get(edge.source_node_id);
        const toEl = nodeRefs.current.get(edge.target_node_id);
        if (fromEl && toEl && svgRef.current) {
          const svgRect = svgRef.current.getBoundingClientRect();
          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();

          computedLines.push({
            from: { x: fromRect.left - svgRect.left + fromRect.width / 2, y: fromRect.bottom - svgRect.top },
            to: { x: toRect.left - svgRect.left + toRect.width / 2, y: toRect.top - svgRect.top },
            label: EDGE_LABELS[edge.kind] || edge.kind,
          });
        }
      }
      setLines(computedLines);
    }, 50);
    return () => clearTimeout(timer);
  }, [edges, expandedNodes.size, nodes.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Status header */}
      <div className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 mb-4 ${STATUS_BG[opinion.status] || 'bg-noc-text3/10 border-noc-text3/30'}`}>
        <span>Blackboard</span>
        <span className="text-[9px] ml-auto opacity-60">{nodes.length} nodes \xB7 {edges.length} edges</span>
      </div>

      {/* Graph area */}
      <div className="flex-1 overflow-auto min-h-0 relative">
        {nodes.length === 0 ? (
          <div className="h-full flex items-center justify-center border border-dashed border-noc-border rounded-xl">
            <p className="text-noc-text3 text-xs mono italic">No graph data yet</p>
          </div>
        ) : (
          <div className="relative py-4 px-2">
            {/* SVG overlay for edge lines */}
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              style={{ minHeight: '500px' }}
            >
              {lines.map((line, i) => (
                <EdgeLabel key={i} label={line.label} x1={line.from.x} y1={line.from.y} x2={line.to.x} y2={line.to.y} />
              ))}
            </svg>

            <div className="flex flex-col items-center gap-3 relative z-10">
              {/* Proposal layer */}
              {layers.proposal.map(n => (
                <NodeCard key={n.id} node={n} expanded={expandedNodes.has(n.id)} onToggle={() => toggleNode(n.id)} onRef={setNodeRef(n.id)} />
              ))}

              {/* Vertical connector */}
              {layers.critiques.length > 0 && (
                <div className="flex items-center gap-2 text-[8px] text-noc-text3 mono">
                  <div className="w-8 border-t border-dashed border-noc-border" />
                  critiques
                  <div className="w-8 border-t border-dashed border-noc-border" />
                </div>
              )}

              {/* Critique layer — side by side */}
              {layers.critiques.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {layers.critiques.map(n => (
                    <NodeCard key={n.id} node={n} expanded={expandedNodes.has(n.id)} onToggle={() => toggleNode(n.id)} onRef={setNodeRef(n.id)} />
                  ))}
                </div>
              )}

              {/* Addresses connector */}
              {layers.syntheses.length > 0 && (
                <div className="flex items-center gap-2 text-[8px] text-noc-text3 mono">
                  <div className="w-8 border-t border-dashed border-noc-border" />
                  addresses
                  <div className="w-8 border-t border-dashed border-noc-border" />
                </div>
              )}

              {/* Synthesis layer */}
              {layers.syntheses.map(n => (
                <NodeCard key={n.id} node={n} expanded={expandedNodes.has(n.id)} onToggle={() => toggleNode(n.id)} onRef={setNodeRef(n.id)} />
              ))}

              {/* Votes connector */}
              {layers.consensus.length > 0 && (
                <div className="flex items-center gap-2 text-[8px] text-noc-text3 mono">
                  <div className="w-8 border-t border-dashed border-noc-border" />
                  votes on
                  <div className="w-8 border-t border-dashed border-noc-border" />
                </div>
              )}

              {/* Consensus layer — side by side */}
              {layers.consensus.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {layers.consensus.map(n => (
                    <NodeCard key={n.id} node={n} expanded={expandedNodes.has(n.id)} onToggle={() => toggleNode(n.id)} onRef={setNodeRef(n.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="border-t border-noc-border pt-3 mt-2 shrink-0">
        <div className="flex flex-wrap gap-3 text-[9px] text-noc-text3 mono">
          {Object.entries(NODE_COLORS).map(([kind, c]) => (
            <span key={kind} className={`flex items-center gap-1 ${c.text}`}>
              <span className={c.icon}>{/* icon in text */}</span>
              <span>{c.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}