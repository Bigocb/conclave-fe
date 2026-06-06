import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Agent } from '../../types/api';
import { Card, Button, Input, Modal } from '../ui/core';
import { Plus, Trash2, Info } from 'lucide-react';
import AgentDetailModal from './AgentDetailModal';

export default function AgentFactory() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [detailAgent, setDetailAgent] = useState<Agent | null>(null);

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.get<Agent[]>('/v1/agents'),
  });

  const registerMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/agents/register', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/agents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.patch(`/v1/agents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setEditAgent(null);
      setIsModalOpen(false);
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold mono text-noc-text1 uppercase tracking-tighter">Agent Factory</h1>
          <p className="text-xs mono text-noc-text2">Provision and manage ephemeral compute nodes</p>
        </div>
        <Button 
          onClick={() => { setEditAgent(null); setIsModalOpen(true); }}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> 
          <span className="text-xs mono">REGISTER AGENT</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center border border-noc-border rounded-2xl bg-noc-bg2">
          <div className="w-6 h-6 border-2 border-noc-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {agents?.map((agent: any) => (
            <Card key={agent.id} className="p-5 group hover:border-noc-green/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-noc-bg3 border border-noc-border rounded-xl flex items-center justify-center text-noc-green mono text-xs font-bold">
                    {agent.type ? agent.type[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mono text-noc-text1 truncate max-w-xs">{agent.name}</h3>
                    <p className="text-[10px] mono text-noc-text3 truncate max-w-xs">{agent.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    onClick={() => setDetailAgent(agent)}
                    className="p-2"
                  >
                    <Info size={14} />
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={() => deleteMutation.mutate(agent.id)}
                    className="p-2"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-noc-border">
                <div>
                  <p className="text-[10px] mono text-noc-text3 uppercase tracking-widest">Provider/Model</p>
                  <p className="text-xs mono text-noc-text2 truncate">
                    {agent.provider || 'custom'} / {agent.model || 'n/a'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] mono text-noc-text3 uppercase tracking-widest">Status</p>
                  <p className="text-xs mono text-noc-green flex items-center justify-end gap-1">
                    <div className="w-1.5 h-1.5 bg-noc-green rounded-full" />
                    {agent.status ? agent.status.toUpperCase() : 'UNKNOWN'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Agent Detail Modal */}
      <AgentDetailModal
        agent={detailAgent}
        isOpen={!!detailAgent}
        onClose={() => setDetailAgent(null)}
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Provision New Agent"
      >
        <form 
          className="grid grid-cols-2 gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = Object.fromEntries(formData.entries());
            
            if (editAgent) {
              updateMutation.mutate({ id: editAgent.id, data });
            } else {
              registerMutation.mutate(data);
            }
          }}
        >
          <div className="col-span-2">
            <Input label="Agent Name" name="name" defaultValue={editAgent?.name} required />
          </div>
          <div className="col-span-1">
            <Input 
              label="Type" 
              name="type" 
              defaultValue={editAgent?.type || 'llm'} 
            />
          </div>
          <div className="col-span-1">
            <Input label="Provider" name="provider" defaultValue={editAgent?.provider} />
          </div>
          <div className="col-span-2">
            <Input label="Model Identifier" name="model" defaultValue={editAgent?.model} />
          </div>
          <div className="col-span-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs mono text-noc-text3 uppercase tracking-wider">System Instructions</label>
              <textarea 
                name="instructions" 
                rows={4}
                className="bg-noc-bg3 border border-noc-border p-2 text-xs mono text-noc-text1 focus:outline-none focus:border-noc-green transition-colors w-full"
                defaultValue={editAgent?.instructions}
              />
            </div>
          </div>
          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>CANCEL</Button>
            <Button type="submit">
              {editAgent ? 'UPDATE NODE' : 'PROVISION AGENT'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
