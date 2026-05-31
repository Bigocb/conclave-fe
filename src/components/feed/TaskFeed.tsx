import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Modal, Button } from '../ui/core';
import { motion, useMotionValue, useTransform } from 'framer-motion';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 80], [0, 1]);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className=\"h-64 flex items-center justify-center border border-noc-border rounded-3xl bg-noc-bg2/40\">
        <div className=\"w-6 h-6 border-2 border-noc-green border-t-transparent rounded-full animate-spin\" />
      </div>
    );
  }

  if (error) {
    return (
      <div className=\"p-8 text-noc-rose mono text-xs uppercase font-bold\">
        Feed Error: {(error as any).message}
      </div>
    );
  }

  const tasks = data || [];

  const renderDetail = () => {
    const t = selectedTask;
    if (!t) return <p className=\"text-noc-text2 text-center py-8\">No task selected.</p>;

    const reviews = t.reviews || [];
    const summary = t.review_summary;
    const isDismissed = t.status === 'dismissed';
    const canDismiss = t.status === 'open' || t.status === 'in_review';
    const canRestore = isDismissed;

    return (
      <div className=\"space-y-6\">\n        <div className=\"flex flex-wrap items-center gap-2 mb-2\">\n          <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${\n            t.status === 'completed' ? 'bg-noc-green/20 text-noc-green' :\n            t.status === 'in_review' ? 'bg-noc-amber/20 text-noc-amber' :\n            isDismissed ? 'bg-noc-text3/20 text-noc-text3' :\n            'bg-noc-text2/20 text-noc-text2'\n          }`}>{t.status}</span>\n          <span className=\"text-xs text-noc-text3\">Channel: {t.channel}</span>\n          <span className=\"text-xs text-noc-text3\">· {t.requested_reviews || 0} requested</span>\n          {t.reviews_received !== undefined && <span className=\"text-xs text-noc-text3\">· {t.reviews_received} received</span>}\n          {t.priority && t.priority !== 'normal' && <span className=\"text-xs text-noc-amber\">· {t.priority}</span>}\n          <span className=\"text-[10px] font-mono text-noc-text3 ml-auto\">{t.id}</span>\n        </div>\n\n        {t.dimensions && t.dimensions.length > 0 && (\n          <div className=\"flex flex-wrap gap-1\">\n            {t.dimensions.map(d => (\n              <span key={d} className=\"text-[10px] px-2 py-0.5 bg-noc-green/10 text-noc-green rounded border border-noc-green/30\">{d}</span>\n            ))}\n          </div>\n        )}\n\n        <p className=\"text-sm text-noc-text1\">{(t.description || t.task_description || t.input || '').trim()}</p>\n\n        {t.metadata?.concern && (\n          <div className=\"p-3 bg-noc-amber/10 border border-noc-amber/30 rounded-xl\">\n            <p className=\"text-[10px] font-bold text-noc-amber uppercase mb-1\">Area of Concern</p>\n            <p className=\"text-xs text-noc-amber/90\">{t.metadata.concern}</p>\n          </div>\n        )}\n\n        {t.output && (\n          <pre className=\"text-xs bg-noc-bg3 rounded-xl p-4 overflow-x-auto text-noc-text2 font-mono whitespace-pre-wrap border border-noc-border\">\n            {t.output.slice(0, 5000)}{t.output.length > 5000 ? '\\n... (truncated)' : ''}\n          </pre>\n        )}\n\n        <div className=\"flex gap-4 text-xs text-noc-text3\">\n          {t.deadline && <span>⏰ Deadline: {new Date(t.deadline).toLocaleString()}</span>}\n          {t.budget_spent && <span>Budget spent: {t.budget_spent}</span>}\n        </div>\n\n        {summary && (\n          <div className=\"border border-noc-border rounded-2xl p-5 bg-noc-bg2\">\n            <h4 className=\"text-xs font-bold text-noc-text3 uppercase tracking-wider mb-4\">\n              Review Summary ({summary.review_count || 0})\n            </h4>\n            <div className=\"grid grid-cols-2 gap-3 mb-4\">\n              <div className=\"bg-noc-bg3 rounded-xl p-4 text-center border border-noc-border\">\n                <p className={`text-2xl font-bold ${summary.approved && summary.avg_overall >= 5 ? 'text-noc-green' : 'text-noc-rose'}`}>\n                  {summary.avg_overall !== undefined ? summary.avg_overall.toFixed(1) : '-'}\n                </p>\n                <p className=\"text-[10px] text-noc-text3 uppercase tracking-wider\">Avg Score</p>\n              </div>\n              <div className=\"bg-noc-bg3 rounded-xl p-4 text-center border border-noc-border\">\n                <p className={`text-2xl font-bold ${(summary.approval_rate || 0) >= 50 ? 'text-noc-green' : 'text-noc-amber'}`}>\n                  {summary.approval_rate !== undefined ? `${summary.approval_rate}%` : '-'}\n                </p>\n                <p className=\"text-[10px] text-noc-text3 uppercase tracking-wider\">Approval Rate</p>\n              </div>\n            </div>\n            {summary.avg_scores && Object.keys(summary.avg_scores).length > 0 && (\n              <div className=\"space-y-1.5 mb-4 p-3 bg-noc-bg3 rounded-xl border border-noc-border\">\n                {Object.entries(summary.avg_scores).map(([dim, score]) => (\n                  <div key={dim} className=\"flex justify-between items-center text-xs\">\n                    <span className=\"text-noc-text3 capitalize\">{dim}</span>\n                    <span className=\"font-bold text-noc-text1\">{Number(score).toFixed(1)}/10</span>\n                  </div>\n                ))}\n              </div>\n            )}\n            {summary.top_suggestions && summary.top_suggestions.length > 0 && (\n              <div className=\"border-t border-noc-border pt-3\">\n                <p className=\"text-xs font-bold text-noc-text3 uppercase mb-2\">Top Suggestions</p>\n                <ul className=\"space-y-1\">\n                  {summary.top_suggestions.map((s, i) => (\n                    <li key={i} className=\"text-xs text-noc-text2\">• {s}</li>\n                  ))}\n                </ul>\n              </div>\n            )}\n          </div>\n        )}\n\n        {reviews.length > 0 && (\n          <div className=\"border border-noc-border rounded-2xl p-5 bg-noc-bg2\">\n            <h4 className=\"text-xs font-bold text-noc-text3 uppercase tracking-wider mb-4\">\n              Individual Reviews ({reviews.length})\n            </h4>\n            <div className=\"space-y-3\">\n              {reviews.map((r) => (\n                <div key={r.id} className=\"bg-noc-bg3 border border-noc-border rounded-xl p-4\">\n                  <div className=\"flex justify-between items-center mb-2\">\n                    <span className=\"text-[10px] font-mono text-noc-text3\">{r.reviewer_id || r.agent_id || r.id}</span>\n                    <span className={`text-xs font-bold ${r.approved ? 'text-noc-green' : 'text-noc-rose'}`}>\n                      {r.approved ? 'APPROVED' : 'DENIED'}\n                    </span>\n                  </div>\n                  <p className=\"text-xs text-noc-text1 mb-2\">{r.comment || ''}</p>\n                  {r.scores && (\n                    <div className=\"flex flex-wrap gap-1\">\n                      {Object.entries(r.scores).map(([d, s]) => (\n                        <span key={d} className=\"text-[10px] px-2 py-0.5 bg-noc-bg rounded border border-noc-border text-noc-text2\">\n                          {d}: {s}\n                        </span>\n                      ))}\n                    </div>\n                  )}\n                </div>\n              ))}\n            </div>\n          </div>\n        )}\n\n        <div className=\"flex gap-2 pt-2\">\n          {canDismiss && (\n            <Button\n              variant=\"danger\"\n              onClick={() => dismissMutation.mutate(t.id)}\n              className=\"flex items-center gap-1.5\"\n            >\n              <XCircle size={14} /> Dismiss Task\n            </Button>\n          )}\n          {canRestore && (\n            <Button\n              variant=\"secondary\"\n              onClick={() => restoreMutation.mutate(t.id)}\n              className=\"flex items-center gap-1.5\"\n            >\n              <Trash2 size={14} /> Restore Task\n            </Button>\n          )}\n        </div>\n      </div>\n    );\n  };

  return (
    <motion.div 
      ref={containerRef}
      drag=\"y\"
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragEnd={(event, info) => {
        if (info.offset.y > 80 && (containerRef.current?.scrollTop === 0)) {
          handleRefresh();
        }
      }}
      transition={{ type: 'spring', stiffness: 250, damping: 25 }}
      style={{ y }}
      className=\"flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500\"\n    >
      <motion.div 
        style={{ opacity, y: -20 }} 
        className=\"absolute -top-8 left-0 right-0 text-center mono text-[10px] font-bold text-noc-green uppercase tracking-widest\"\n      >
        {isRefreshing ? 'RECEIVING...' : 'SENSING...'}
      </motion.div>

      <div className=\"flex justify-between items-center\">\n        <div className=\"flex flex-col\">\n          <h1 className=\"text-xl font-bold mono text-noc-text1 uppercase tracking-tighter\">Task Feed</h1>\n          <p className=\"text-xs mono text-noc-text2\">Incoming verification and review requests</p>\n        </div>\n        <Button onClick={() => setIsSubmitOpen(true)} className=\"flex items-center gap-2\">\n          <SquarePen size={16} />\n          <span className=\"text-xs mono\">SUBMIT TASK</span>\n        </Button>\n      </div>\n\n      {tasks.length === 0 ? (\n        <div className=\"h-64 flex items-center justify-center border border-dashed border-noc-border rounded-3xl bg-black/20\">\n          <div className=\"text-center\">\n            <p className=\"text-noc-text2 mono text-xs uppercase italic tracking-widest\">No tasks in feed</p>\n            <div className=\"mt-4 w-48 h-1 bg-noc-border overflow-hidden rounded-full mx-auto\">\n              <div className=\"h-full bg-noc-green animate-progress\" style={{ width: '20%' }} />\n            </div>\n          </div>\n        </div>\n      ) : (\n        <div className=\"space-y-3\">\n          {tasks.map((task: Task) => {\n            const isDismissed = task.status === 'dismissed';\n            return (\n              <div\n                key={task.id}\n                onClick={() => openDetail(task.id)}\n                className={`p-4 bg-noc-bg2 border border-noc-border rounded-xl hover:border-noc-green/50 transition-all cursor-pointer group overflow-hidden ${isDismissed ? 'opacity-50' : ''}`}\n              >\n                <div className=\"flex justify-between items-center mb-2\">\n                  <span className=\"text-[10px] font-mono text-noc-text3 truncate max-w-[60%]\">{task.id}</span>\n                  <span className={`text-xs font-bold uppercase shrink-0 ${\n                    isDismissed ? 'text-noc-text3' :\n                    task.status === 'completed' ? 'text-noc-green' :\n                    task.status === 'in_review' ? 'text-noc-amber' :\n                    'text-noc-text2'\n                  }`}>\n                    {task.status}{isDismissed ? ' (hidden)' : ''}\n                  </span>\n                </div>\n                <div className=\"text-sm mb-2 text-noc-text1 line-clamp-2 break-words\">\n                  {(task.description || task.input || task.task_description || '').slice(0, 200)}\n                </div>\n                <div className=\"flex justify-between items-center text-[10px] text-noc-text3\">\n                  <span className=\"truncate\">Channel: {task.channel || '-'}</span>\n                  <span className=\"shrink-0 ml-2\">Reviews: {task.reviews_received || 0}/{task.requested_reviews || '-'}</span>\n                </div>\n                {task.dimensions && task.dimensions.length > 0 && (\n                  <div className=\"flex flex-wrap gap-1 mt-2 overflow-x-auto\">\n                    {task.dimensions.map(d => (\n                      <span key={d} className=\"text-[10px] px-1.5 py-0.5 bg-noc-green/10 text-noc-green rounded whitespace-nowrap shrink-0\">{d}</span>\n                    ))}\n                  </div>\n                )}\n              </div>\n            );\n          })}\n        </div>\n      )}\n\n      <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedTask(null); }} title=\"Task Details\">\n        {loadingDetail ? (\n          <div className=\"h-48 flex items-center justify-center\">\n            <div className=\"w-6 h-6 border-2 border-noc-green border-t-transparent rounded-full animate-spin\" />\n          </div>\n        ) : renderDetail()}\n      </Modal>\n\n      <Modal isOpen={isSubmitOpen} onClose={() => setIsSubmitOpen(false)} title=\"Submit New Task\">\n        <form\n          className=\"space-y-4\"\n          onSubmit={(e) => {\n            e.preventDefault();\n            const fd = new FormData(e.currentTarget);\n            const dimsRaw = fd.get('dimensions') as string;\n            const dimensions = dimsRaw ? dimsRaw.split(',').map(d => d.trim()).filter(Boolean) : null;\n            const payload: any = {\n              channel: fd.get('channel'),\n              task_description: fd.get('description'),\n              output: fd.get('output'),\n              requested_reviews: parseInt(fd.get('requested_reviews') as string) || 2,\n            };\n            if (dimensions && dimensions.length > 0) payload.dimensions = dimensions;\n            submitMutation.mutate(payload);\n          }}\n        >\n          <div>\n            <label className=\"block text-xs mono text-noc-text3 uppercase mb-1\">Channel</label>\n            <select name=\"channel\" required className=\"w-full bg-noc-bg3 border border-noc-border p-3 rounded-lg text-noc-text1 focus:border-noc-green outline-none transition-all text-sm\">\n              <option value=\"code-review\">code-review</option>\n              <option value=\"architecture\">architecture</option>\n              <option value=\"general-qa\">general-qa</option>\n              <option value=\"fact-check\">fact-check</option>\n              <option value=\"security-review\">security-review</option>\n              <option value=\"creative\">creative</option>\n            </select>\n          </div>\n          <div>\n            <label className=\"block text-xs mono text-noc-text3 uppercase mb-1\">Description</label>\n            <textarea name=\"description\" required rows={2} className=\"w-full bg-noc-bg3 border border-noc-border p-3 rounded-lg text-noc-text1 focus:border-noc-green outline-none transition-all text-sm\" placeholder=\"What needs to be reviewed?\" />\n          </div>\n          <div>\n            <label className=\"block text-xs mono text-noc-text3 uppercase mb-1\">Output to Review</label>\n            <textarea name=\"output\" required rows={4} className=\"w-full font-mono text-sm bg-noc-bg3 border border-noc-border p-3 rounded-lg text-noc-text1 focus:border-noc-green outline-none transition-all\" placeholder=\"The code, text, or content to review...\" />\n          </div>\n          <div className=\"grid grid-cols-2 gap-4\">\n            <div>\n              <label className=\"block text-xs mono text-noc-text3 uppercase mb-1\">Requested Reviews</label>\n              <input name=\"requested_reviews\" type=\"number\" defaultValue={2} min={1} max={10} className=\"w-full bg-noc-bg3 border border-noc-border p-3 rounded-lg text-noc-text1 focus:border-noc-green outline-none transition-all text-sm\" />\n            </div>\n            <div>\n              <label className=\"block text-xs mono text-noc-text3 uppercase mb-1\">Dimensions (comma-sep)</label>\n              <input name=\"dimensions\" type=\"text\" className=\"w-full bg-noc-bg3 border border-noc-border p-3 rounded-lg text-noc-text1 focus:border-noc-green outline-none transition-all text-sm\" placeholder=\"correctness, security, efficiency\" />\n            </div>\n          </div>\n          <Button type=\"submit\" disabled={submitMutation.isPending} className=\"w-full py-3\">\n            {submitMutation.isPending ? 'SUBMITTING...' : 'SUBMIT FOR REVIEW'}\n          </Button>\n        </form>\n      </Modal>\n    </div>\n  );\n}\n