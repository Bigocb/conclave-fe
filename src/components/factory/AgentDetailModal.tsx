import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Agent } from '../../types/api';
import { Modal, Card, Button } from '../ui/core';
import { Info, Plug, Edit3 } from 'lucide-react';
import McpConfigTab from './McpConfigTab';

interface Props {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabId = 'overview' | 'mcp';

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'mcp', label: 'MCP Config', icon: Plug },
];

export default function AgentDetailModal({ agent, isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/v1/agents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      onClose();
    }
  });

  if (!agent) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Agent: ${agent.name}`}>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-noc-border pb-0 -mx-6 px-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs mono font-bold transition-all border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? 'text-noc-green border-noc-green'
                : 'text-noc-text3 border-transparent hover:text-noc-text2'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <form
          className="grid grid-cols-2 gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = Object.fromEntries(formData.entries());
            updateMutation.mutate({ id: agent.id, data });
          }}
        >
          <div className="col-span-2">
            <p className="text-[10px] mono text-noc-text3 uppercase tracking-widest">Agent ID</p>
            <p className="text-xs mono text-noc-text2 font-mono break-all bg-black/30 p-2 rounded border border-noc-border mt-1">{agent.id}</p>
          </div>
          <div className="col-span-2">
            <label className="text-xs mono text-noc-text3 uppercase tracking-wider">Name</label>
            <input
              name="name"
              defaultValue={agent.name}
              className="bg-noc-bg3 border border-noc-border p-2 text-xs mono text-noc-text1 focus:outline-none focus:border-noc-green transition-colors w-full mt-1"
            />
          </div>
          <div>
            <label className="text-xs mono text-noc-text3 uppercase tracking-wider">Type</label>
            <input
              name="type"
              defaultValue={agent.type || 'llm'}
              className="bg-noc-bg3 border border-noc-border p-2 text-xs mono text-noc-text1 focus:outline-none focus:border-noc-green transition-colors w-full mt-1"
            />
          </div>
          <div>
            <label className="text-xs mono text-noc-text3 uppercase tracking-wider">Provider</label>
            <input
              name="provider"
              defaultValue={agent.provider || ''}
              className="bg-noc-bg3 border border-noc-border p-2 text-xs mono text-noc-text1 focus:outline-none focus:border-noc-green transition-colors w-full mt-1"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs mono text-noc-text3 uppercase tracking-wider">Model</label>
            <input
              name="model"
              defaultValue={agent.model || ''}
              className="bg-noc-bg3 border border-noc-border p-2 text-xs mono text-noc-text1 focus:outline-none focus:border-noc-green transition-colors w-full mt-1"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs mono text-noc-text3 uppercase tracking-wider">System Instructions</label>
            <textarea
              name="instructions"
              rows={4}
              defaultValue={agent.instructions || ''}
              className="bg-noc-bg3 border border-noc-border p-2 text-xs mono text-noc-text1 focus:outline-none focus:border-noc-green transition-colors w-full mt-1"
            />
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-noc-border">
            <Button variant="secondary" onClick={onClose}>CANCEL</Button>
            <Button type="submit">UPDATE NODE</Button>
          </div>
        </form>
      )}

      {activeTab === 'mcp' && <McpConfigTab agent={agent} />}
    </Modal>
  );
}