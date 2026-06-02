import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Agent } from '../../types/api';
import { Card, Input, Button, Modal, Select } from '../ui/core';
import { Plus, Trash2, Edit3 } from 'lucide-react';

const PROVIDERS = ['openai', 'openrouter', 'ollama', 'ollama_cloud', 'anthropic', 'together', 'fireworks', 'groq', 'vllm', 'litellm', 'custom', 'opencode'];

interface AgentFormData {
  name: string;
  type: string;
  provider: string;
  model: string;
  instructions: string;
}

const defaultForm = (agent?: Agent | null): AgentFormData => ({
  name: agent?.name || '',
  type: agent?.type || 'llm',
  provider: agent?.provider || '',
  model: agent?.model || '',
  instructions: agent?.instructions || '',
});

export default function AgentFactory() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState<AgentFormData>(defaultForm());

  const selectedProvider = editAgent?.provider || form.provider;

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.get<Agent[]>('/v1/agents/org')
  });

  const { data: models } = useQuery({
    queryKey: ['models', selectedProvider],
    queryFn: () => api.get<string[]>(`/v1/providers/${selectedProvider}/models`),
    enabled: !!selectedProvider && selectedProvider !== 'custom',
    staleTime: 120_000,
    retry: 1
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

  const openModal = (agent?: Agent | null) => {
    setEditAgent(agent || null);
    setForm(defaultForm(agent));
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form };
    if (editAgent) {
      updateMutation.mutate({ id: editAgent.id, data });
    } else {
      registerMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold mono text-white uppercase tracking-tighter">Agent Factory</h1>
          <p className="text-xs mono text-slate-500">Provision and manage ephemeral compute nodes</p>
        </div>
        <Button 
          onClick={() => openModal(null)}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> 
          <span className="text-xs mono">REGISTER AGENT</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center border border-aviation-border rounded-lg bg-aviation-panel">
          <div className="w-6 h-6 border-2 border-aviation-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {agents?.map((agent: any) => (
            <Card key={agent.id} className="p-4 group hover:border-aviation-accent/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black border border-aviation-border rounded flex items-center justify-center text-aviation-accent mono text-xs font-bold">
                    {agent.type ? agent.type[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mono text-white truncate max-w-xs">{agent.name}</h3>
                    <p className="text-[10px] mono text-slate-500 truncate max-w-xs">{agent.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    onClick={() => openModal(agent)}
                    className="p-2"
                  >
                    <Edit3 size={14} />
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
              
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-aviation-border">
                <div>
                  <p className="text-[10px] mono text-slate-600 uppercase tracking-widest">Provider/Model</p>
                  <p className="text-xs mono text-slate-300 truncate">
                    {agent.provider || 'custom'} / {agent.model || 'n/a'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] mono text-slate-600 uppercase tracking-widest">Status</p>
                  <p className="text-xs mono text-aviation-accent flex items-center justify-end gap-1">
                    <div className="w-1.5 h-1.5 bg-aviation-accent rounded-full" />
                    {agent.status ? agent.status.toUpperCase() : 'UNKNOWN'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editAgent ? "Modify Agent Node" : "Provision New Agent"}
      >
        <form 
          className="grid grid-cols-2 gap-6"
          onSubmit={handleSubmit}
        >
          <div className="col-span-2">
            <Input label="Agent Name" name="name" defaultValue={form.name} required onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="col-span-1">
            <Select
              label="Type"
              name="type"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            >
              <option value="llm">LLM</option>
              <option value="slim">Slim</option>
              <option value="code">Code</option>
              <option value="pipeline">Pipeline</option>
            </Select>
          </div>
          <div className="col-span-1">
            <Select
              label="Provider"
              name="provider"
              value={form.provider}
              onChange={e => setForm(f => ({ ...f, provider: e.target.value, model: '' }))}
            >
              <option value="">-- Select Provider --</option>
              {PROVIDERS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </div>
          <div className="col-span-2">
            {models && models.length > 0 ? (
              <Select
                label="Model Identifier"
                name="model"
                value={form.model}
                onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                placeholder="Select model..."
              >
                {models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            ) : (
              <Input
                label="Model Identifier"
                name="model"
                value={form.model}
                onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                placeholder={form.provider ? "Enter model name or URL" : "Select a provider first"}
              />
            )}
          </div>
          <div className="col-span-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs mono text-slate-500 uppercase tracking-wider">System Instructions</label>
              <textarea 
                name="instructions" 
                rows={4}
                className="bg-black border border-aviation-border p-2 text-xs mono text-white focus:outline-none focus:border-aviation-accent transition-colors w-full"
                defaultValue={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
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
