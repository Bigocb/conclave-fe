import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

interface Task {
  id: string;
  description: string;
  channel: string;
  status: string;
  priority?: string;
  created_at?: string;
  requested_reviews?: number;
}

export default function TaskFeed() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', 'feed'],
    queryFn: async () => {
      const res = await api.get<any>('/v1/tasks');
      const tasks = res?.tasks || res?.data?.tasks || [];
      return tasks as Task[];
    }
  });

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

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold mono text-noc-text1 uppercase tracking-tighter">Task Feed</h1>
          <p className="text-xs mono text-noc-text2">Incoming verification and review requests</p>
        </div>
      </div>

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
        <div className="space-y-3">
          {tasks.map((task: Task) => (
            <div key={task.id} className="p-5 bg-noc-bg2 border border-noc-border rounded-2xl hover:border-noc-green/30 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-noc-green' : task.status === 'in_review' ? 'bg-noc-amber' : 'bg-noc-text3'}`} />
                  <h3 className="text-sm font-bold mono text-noc-text1 group-hover:text-noc-green/80 transition-colors truncate max-w-md">
                    {task.description || 'Untitled Task'}
                  </h3>
                </div>
                <span className="text-[10px] mono uppercase px-2 py-0.5 rounded-full border border-current/20 text-noc-amber bg-noc-amber/5">
                  {task.status || 'pending'}
                </span>
              </div>
              <div className="flex gap-4 text-xs mono text-noc-text2">
                <span>Channel: {task.channel || 'general'}</span>
                <span>ID: {task.id?.slice(0, 12)}...</span>
                <span>Reviews: {task.requested_reviews || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
