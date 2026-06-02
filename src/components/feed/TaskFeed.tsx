import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Modal, Button } from '../ui/core';
import { SquarePen, Trash2, XCircle } from 'lucide-react';

interface Task {
  id: string;
  description?: string;
  task_description?: string;
  input?: string;
  channel: string;
  status: string;
  priority?: string;
  created_at?: string;
  requested_reviews?: number;
  reviews_received?: number;
  dimensions?: string[];
  output?: string;
  metadata?: { concern?: string };
  deadline?: string;
  budget_spent?: number;
}

interface Review {
  id: string;
  reviewer_id?: string;
  agent_id?: string;
  approved: boolean;
  comment?: string;
  scores?: Record<string, number>;
  weighted_overall?: number;
  suggestions?: string[];
  created_at?: string;
}

interface ReviewSummary {
  review_count: number;
  avg_overall: number;
  approval_rate: number;
  approved: boolean;
  avg_scores?: Record<string, number>;
  top_suggestions?: string[];
}

interface TaskDetail extends Task {
  reviews?: Review[];
  review_summary?: ReviewSummary;
}

export default function TaskFeed() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', 'feed'],
    queryFn: async () => {
      const res = await api.get<any>('/v1/tasks');
      const tasks = res?.tasks || res?.data?.tasks || res?.data || [];
      return tasks as Task[];
    }
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsSubmitOpen(false);
    }
  });

  const dismissMutation = useMutation({
    mutationFn: (taskId: string) => api.post(`/v1/tasks/${taskId}/dismiss`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsDetailOpen(false);
      setSelectedTask(null);
    }
  });

  const restoreMutation = useMutation({
    mutationFn: (taskId: string) => api.post(`/v1/tasks/${taskId}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsDetailOpen(false);
      setSelectedTask(null);
    }
  });

  const openDetail = async (taskId: string) => {
    setIsDetailOpen(true);
    setLoadingDetail(true);
    try {
      const res = await api.get<any>(`/v1/tasks/${taskId}`);
      const task = res?.data || res;
      setSelectedTask(task as TaskDetail);
    } catch (e: any) {
      setSelectedTask({ id: taskId, channel: '', status: 'error', description: `Failed to load: ${e.message}` } as TaskDetail);
    } finally {
      setLoadingDetail(false);
    }
  };

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

  const tasks = data || [];

  const renderDetail = () => {
    const t = selectedTask;
    if (!t) return <p className="text-noc-text2 text-center py-8">No task selected.</p>;

    const reviews = t.reviews || [];
    const summary = t.review_summary;
    const isDismissed = t.status === 'dismissed';
    const canDismiss = t.status === 'open' || t.status === 'in_review';
    const canRestore = isDismissed;

    return (
      <div className="space-y-6">
        {/* Header: status, channel, reviews */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
            t.status === 'completed' ? 'bg-noc-green/20 text-noc-green' :
            t.status === 'in_review' ? 'bg-noc-amber/20 text-noc-amber' :
            isDismissed ? 'bg-noc-text3/20 text-noc-text3' :
            'bg-noc-text2/20 text-noc-text2'
          }`}>{t.status}</span>
          <span className="text-xs text-noc-text3">Channel: {t.channel}</span>
          <span className="text-xs text-noc-text3">· {t.requested_reviews || 0} requested</span>
          {t.reviews_received !== undefined && <span className="text-xs text-noc-text3">· {t.reviews_received} received</span>}
          {t.priority && t.priority !== 'normal' && <span className="text-xs text-noc-amber">· {t.priority}</span>}
          <span className="text-[10px] font-mono text-noc-text3 ml-auto">{t.id}</span>
        </div>

        {/* Dimensions */}
        {t.dimensions && t.dimensions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {t.dimensions.map(d => (
              <span key={d} className="text-[10px] px-2 py-0.5 bg-noc-green/10 text-noc-green rounded border border-noc-green/30">{d}</span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-noc-text1">{(t.description || t.task_description || t.input || '').trim()}</p>

        {/* Area of Concern */}
        {t.metadata?.concern && (
          <div className="p-3 bg-noc-amber/10 border border-noc-amber/30 rounded-xl">
            <p className="text-[10px] font-bold text-noc-amber uppercase mb-1">Area of Concern</p>
            <p className="text-xs text-noc-amber/90">{t.metadata.concern}</p>
          </div>
        )}

        {/* Output */}
        {t.output && (
          <pre className="text-xs bg-noc-bg3 rounded-xl p-4 overflow-x-auto text-noc-text2 font-mono whitespace-pre-wrap border border-noc-border">
            {t.output.slice(0, 5000)}{t.output.length > 5000 ? '\n... (truncated)' : ''}
          </pre>
        )}

        {/* Meta info */}
        <div className="flex gap-4 text-xs text-noc-text3">
          {t.deadline && <span>⏰ Deadline: {new Date(t.deadline).toLocaleString()}</span>}
          {t.budget_spent && <span>Budget spent: {t.budget_spent}</span>}
        </div>

        {/* Review Summary */}
        {summary && (
          <div className="border border-noc-border rounded-2xl p-5 bg-noc-bg2">
            <h4 className="text-xs font-bold text-noc-text3 uppercase tracking-wider mb-4">
              Review Summary ({summary.review_count || 0})
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-noc-bg3 rounded-xl p-4 text-center border border-noc-border">
                <p className={`text-2xl font-bold ${summary.approved && summary.avg_overall >= 5 ? 'text-noc-green' : 'text-noc-rose'}`}>
                  {summary.avg_overall !== undefined ? summary.avg_overall.toFixed(1) : '-'}
                </p>
                <p className="text-[10px] text-noc-text3 uppercase tracking-wider">Avg Score</p>
              </div>
              <div className="bg-noc-bg3 rounded-xl p-4 text-center border border-noc-border">
                <p className={`text-2xl font-bold ${(summary.approval_rate || 0) >= 50 ? 'text-noc-green' : 'text-noc-amber'}`}>
                  {summary.approval_rate !== undefined ? `${summary.approval_rate}%` : '-'}
                </p>
                <p className="text-[10px] text-noc-text3 uppercase tracking-wider">Approval Rate</p>
              </div>
            </div>

            {/* Per-dimension scores */}
            {summary.avg_scores && Object.keys(summary.avg_scores).length > 0 && (
              <div className="space-y-1.5 mb-4 p-3 bg-noc-bg3 rounded-xl border border-noc-border">
                {Object.entries(summary.avg_scores).map(([dim, score]) => (
                  <div key={dim} className="flex justify-between items-center text-xs">
                    <span className="text-noc-text3 capitalize">{dim}</span>
                    <span className="font-bold text-noc-text1">{Number(score).toFixed(1)}/10</span>
                  </div>
                ))}
              </div>
            )}

            {/* Top suggestions */}
            {summary.top_suggestions && summary.top_suggestions.length > 0 && (
              <div className="border-t border-noc-border pt-3">
                <p className="text-xs font-bold text-noc-text3 uppercase mb-2">Top Suggestions</p>
                <ul className="space-y-1">
                  {summary.top_suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-noc-text2">• {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Individual Reviews */}
        {reviews.length > 0 && (
          <div className="border border-noc-border rounded-2xl p-5 bg-noc-bg2">
            <h4 className="text-xs font-bold text-noc-text3 uppercase tracking-wider mb-4">
              Individual Reviews ({reviews.length})
            </h4>
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-noc-bg3 border border-noc-border rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono text-noc-text3">{r.reviewer_id || r.agent_id || r.id}</span>
                    <span className={`text-xs font-bold ${r.approved ? 'text-noc-green' : 'text-noc-rose'}`}>
                      {r.approved ? 'APPROVED' : 'DENIED'}
                    </span>
                  </div>
                  <p className="text-xs text-noc-text1 mb-2">{r.comment || ''}</p>
                  {r.scores && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(r.scores).map(([d, s]) => (
                        <span key={d} className="text-[10px] px-2 py-0.5 bg-noc-bg rounded border border-noc-border text-noc-text2">
                          {d}: {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dismiss / Restore actions */}
        <div className="flex gap-2 pt-2">
          {canDismiss && (
            <Button
              variant="danger"
              onClick={() => dismissMutation.mutate(t.id)}
              className="flex items-center gap-1.5"
            >
              <XCircle size={14} /> Dismiss Task
            </Button>
          )}
          {canRestore && (
            <Button
              variant="secondary"
              onClick={() => restoreMutation.mutate(t.id)}
              className="flex items-center gap-1.5"
            >
              <Trash2 size={14} /> Restore Task
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold mono text-noc-text1 uppercase tracking-tighter">Task Feed</h1>
          <p className="text-xs mono text-noc-text2">Incoming verification and review requests</p>
        </div>
        <Button onClick={() => setIsSubmitOpen(true)} className="flex items-center gap-2">
          <SquarePen size={16} />
          <span className="text-xs mono">SUBMIT TASK</span>
        </Button>
      </div>

      {/* Empty state */}
      {tasks.length === 0 ? (
        <div className="h-64 flex items-center justify-center border border-dashed border-noc-border rounded-3xl bg-black/20">
          <div className="text-center">
            <p className="text-noc-text2 mono text-xs uppercase italic tracking-widest">No tasks in feed</p>
            <div className="mt-4 w-48 h-1 bg-noc-border overflow-hidden rounded-full mx-auto">
              <div className="h-full bg-noc-green animate-progress" style={{ width: '20%' }} />
            </div>
          </div>
        </div>
      ) : (
        /* Task list */
        <div className="space-y-3">
          {tasks.map((task: Task) => {
            const isDismissed = task.status === 'dismissed';
            return (
              <div
                key={task.id}
                onClick={() => openDetail(task.id)}
                className={`p-4 bg-noc-bg2 border border-noc-border rounded-xl hover:border-noc-green/50 transition-all cursor-pointer group overflow-hidden ${isDismissed ? 'opacity-50' : ''}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono text-noc-text3 truncate max-w-[60%]">{task.id}</span>
                  <span className={`text-xs font-bold uppercase shrink-0 ${
                    isDismissed ? 'text-noc-text3' :
                    task.status === 'completed' ? 'text-noc-green' :
                    task.status === 'in_review' ? 'text-noc-amber' :
                    'text-noc-text2'
                  }`}>
                    {task.status}{isDismissed ? ' (hidden)' : ''}
                  </span>
                </div>
                <div className="text-sm mb-2 text-noc-text1 line-clamp-2 break-words">
                  {(task.description || task.input || task.task_description || '').slice(0, 200)}
                </div>
                <div className="flex justify-between items-center text-[10px] text-noc-text3">
                  <span className="truncate">Channel: {task.channel || '-'}</span>
                  <span className="shrink-0 ml-2">Reviews: {task.reviews_received || 0}/{task.requested_reviews || '-'}</span>
                </div>
                {task.dimensions && task.dimensions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 overflow-x-auto">
                    {task.dimensions.map(d => (
                      <span key={d} className="text-[10px] px-1.5 py-0.5 bg-noc-green/10 text-noc-green rounded whitespace-nowrap shrink-0">{d}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedTask(null); }} title="Task Details">
        {loadingDetail ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-noc-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : renderDetail()}
      </Modal>

      {/* Submit Task Modal */}
      <Modal isOpen={isSubmitOpen} onClose={() => setIsSubmitOpen(false)} title="Submit New Task">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const dimsRaw = fd.get('dimensions') as string;
            const dimensions = dimsRaw ? dimsRaw.split(',').map(d => d.trim()).filter(Boolean) : null;
            const payload: any = {
              channel: fd.get('channel'),
              task_description: fd.get('description'),
              output: fd.get('output'),
              requested_reviews: parseInt(fd.get('requested_reviews') as string) || 2,
            };
            if (dimensions && dimensions.length > 0) payload.dimensions = dimensions;
            submitMutation.mutate(payload);
          }}
        >
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
            <label className="block text-xs mono text-noc-text3 uppercase mb-1">Description</label>
            <textarea name="description" required rows={2} className="w-full bg-noc-bg3 border border-noc-border p-3 rounded-lg text-noc-text1 focus:border-noc-green outline-none transition-all text-sm" placeholder="What needs to be reviewed?" />
          </div>
          <div>
            <label className="block text-xs mono text-noc-text3 uppercase mb-1">Output to Review</label>
            <textarea name="output" required rows={4} className="w-full font-mono text-sm bg-noc-bg3 border border-noc-border p-3 rounded-lg text-noc-text1 focus:border-noc-green outline-none transition-all" placeholder="The code, text, or content to review..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mono text-noc-text3 uppercase mb-1">Requested Reviews</label>
              <input name="requested_reviews" type="number" defaultValue={2} min={1} max={10} className="w-full bg-noc-bg3 border border-noc-border p-3 rounded-lg text-noc-text1 focus:border-noc-green outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs mono text-noc-text3 uppercase mb-1">Dimensions (comma-sep)</label>
              <input name="dimensions" type="text" className="w-full bg-noc-bg3 border border-noc-border p-3 rounded-lg text-noc-text1 focus:border-noc-green outline-none transition-all text-sm" placeholder="correctness, security, efficiency" />
            </div>
          </div>
          <Button type="submit" disabled={submitMutation.isPending} className="w-full py-3">
            {submitMutation.isPending ? 'SUBMITTING...' : 'SUBMIT FOR REVIEW'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
