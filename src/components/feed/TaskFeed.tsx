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
      console.log('[TaskFeed] API response:', JSON.stringify(res).slice(0, 500));
      // The API returns wrapped data: { tasks: [...], total: N } or { data: { tasks: [...], total: N } }
      const tasks = res?.tasks || res?.data?.tasks || [];
      return tasks as Task[];
    },
  });

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center border border-[#2a385a] rounded-3xl bg-[#111520]/40">
        <div className="w-6 h-6 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-400 mono text-xs uppercase font-bold">
        Feed Error: {(error as any).message}
      </div>
    );
  }

  const tasks = data || [];

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold mono text-white uppercase tracking-tighter">Task Feed</h1>
          <p className="text-xs mono text-slate-500">Incoming verification and review requests</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="h-64 flex items-center justify-center border border-dashed border-[#2a385a] rounded-3xl bg-black/20">
          <div className="text-center">
            <p className="text-slate-500 mono text-xs uppercase italic tracking-widest">No tasks in feed</p>
            <div className="mt-4 w-48 h-1 bg-[#2a385a] overflow-hidden rounded-full mx-auto">
              <div className="h-full bg-[#39FF14] animate-progress" style={{ width: '20%' }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task: Task) => (
            <div key={task.id} className="p-5 bg-[#111520] border border-[#2a385a] rounded-2xl hover:border-[#39FF14]/30 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-[#39FF14]' : task.status === 'in_review' ? 'bg-yellow-400' : 'bg-slate-500'}`} />
                  <h3 className="text-sm font-bold mono text-white group-hover:text-[#39FF14]/80 transition-colors truncate max-w-md">
                    {task.description || 'Untitled Task'}
                  </h3>
                </div>
                <span className="text-[10px] mono uppercase px-2 py-0.5 rounded-full border border-current/20 text-amber-400 bg-amber-400/5">
                  {task.status || 'pending'}
                </span>
              </div>
              <div className="flex gap-4 text-xs mono text-slate-500">
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
