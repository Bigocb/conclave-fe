import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Modal, Select } from '../ui/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface Agent {
  id: string;
  name: string;
  model?: string;
  provider?: string;
  status?: string;
  skills?: string;
  instructions?: string;
}

export default function AgentFactory() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.get<Agent[]>('/v1/agents'),
  });

  const { data: vaultKeys } = useQuery({
    queryKey: ['vault'],
    queryFn: async () => {
      const res = await api.get<any>('/v1/vault/keys');
      return (res?.data || res || []) as any[];
    },
  });

  // Fetch models when provider changes
  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['provider-models', selectedProvider],
    queryFn: async () => {
      if (!selectedProvider || selectedProvider === 'custom') return [];
      const res = await api.get<any>(`/v1/providers/${selectedProvider}/models`);
      const list = (res?.data || res || []);
      return list as { id: string; provider: string }[];
    },
    enabled: !!selectedProvider && selectedProvider !== 'custom',
    staleTime: 30_000,
    retry: 1,
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

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name'),
      type: fd.get('type') || 'llm',
      provider: fd.get('provider'),
      model: fd.get('model'),
      instructions: fd.get('instructions'),
    };
    if (editAgent) {
      updateMutation.mutate({ id: editAgent.id, data });
    } else {
      registerMutation.mutate(data);
    }
  };

  const providerOptions = [
    ...(vaultKeys?.map(k => ({ value: k.provider, label: k.provider })) || []),
    { value: 'custom', label: 'Custom' },
  ];

  const modelOptions = models?.map(m => ({ value: m.id, label: m.id })) || [];
  const showCustomModel = selectedProvider === 'custom' || !modelOptions.length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold mono text-noc-text1 uppercase tracking-tighter">Agent Factory</h1>
          <p className="text-xs mono text-noc-text2 mt-1">Provision and manage autonomous agents</p>
        </div>
        <Button onClick={() => { setEditAgent(null); setIsModalOpen(true); }} className="flex items-center gap-1.5">
          + PROVISION
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-xs mono text-noc-text2 animate-pulse">Loading agents...</p>
          </div>
        )}

        {!isLoading && (!agents || agents.length === 0) && (
          <div className="text-center py-12 border-2 border-dashed border-noc-border rounded-2xl">
            <p className="text-sm mono text-noc-text2">No agents provisioned</p>
            <p className="text-[10px] mono text-noc-text3 mt-2">Create your first node to begin</p>
          </div>
        )}

        {agents?.map((agent) => (
          <Card key={agent.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm mono text-noc-text1 font-bold">{agent.name}</p>
              <p className="text-[10px] mono text-noc-text2 mt-1">
                {agent.provider || 'custom'} / {agent.model || 'n/a'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="p-1.5" onClick={() => {
                setEditAgent(agent);
                setSelectedProvider(agent.provider || '');
                setIsModalOpen(true);
              }}>
                EDIT
              </Button>
              <Button variant="danger" className="p-1.5" onClick={() => deleteMutation.mutate(agent.id)}>
                DELETE
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditAgent(null); setSelectedProvider(''); }}
        title={editAgent ? 'Edit Agent' : 'Provision Agent'}>
        <form className="grid grid-cols-2 gap-4" onSubmit={handleFormSubmit}>
          <div className="col-span-2">
            <Input label="Agent Name" name="name" defaultValue={editAgent?.name} required />
          </div>
          <div className="col-span-1">
            <Input label="Type" name="type" defaultValue={editAgent?.type || 'llm'} />
          </div>
          <div className="col-span-1">
            <Select
              label="Provider"
              name="provider"
              defaultValue={editAgent?.provider}
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              options={providerOptions}
            />
          </div>
          <div className="col-span-2">
            {showCustomModel ? (
              <Input
                label="Model Identifier"
                name="model"
                defaultValue={editAgent?.model}
                placeholder={selectedProvider === 'custom' ? 'e.g. my-custom-model' : 'Type model name...'}
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs mono text-noc-text3 uppercase tracking-wider">
                  Model {modelsLoading && <span className="text-noc-text3 animate-pulse ml-2">(loading...)</span>}
                </label>
                <select
                  name="model"
                  defaultValue={editAgent?.model || ''}
                  className="bg-noc-bg3 border border-noc-border p-2 text-xs mono text-noc-text1 focus:outline-none focus:border-noc-green transition-colors w-full"
                >
                  <option value="">-- Select model --</option>
                  {modelOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
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
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); setEditAgent(null); setSelectedProvider(''); }}>CANCEL</Button>
            <Button type="submit">
              {editAgent ? 'UPDATE NODE' : 'PROVISION AGENT'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}