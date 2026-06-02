import { useState } from 'react';
import TaskFeed from './TaskFeed';
import OpinionFeed from './OpinionFeed';

type FeedTab = 'tasks' | 'opinions';

export default function FeedView() {
  const [activeTab, setActiveTab] = useState<FeedTab>('tasks');

  return (
    <div className="flex flex-col gap-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Tab Switcher */}
      <div className="flex items-center gap-1 mb-4 p-1 bg-noc-bg3/60 border border-noc-border rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-5 py-2 rounded-lg text-xs mono font-bold uppercase tracking-wider transition-all ${
            activeTab === 'tasks'
              ? 'bg-noc-green/15 text-noc-green border border-noc-green/30 shadow-sm'
              : 'text-noc-text3 hover:text-noc-text2 border border-transparent'
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveTab('opinions')}
          className={`px-5 py-2 rounded-lg text-xs mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'opinions'
              ? 'bg-noc-green/15 text-noc-green border border-noc-green/30 shadow-sm'
              : 'text-noc-text3 hover:text-noc-text2 border border-transparent'
          }`}
        >
          Opinions
        </button>
      </div>

      {activeTab === 'tasks' ? <TaskFeed /> : <OpinionFeed />}
    </div>
  );
}