import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, Input, Button, Modal, Select } from '../ui/core';
import { FileText, Plus, Trash2, Edit3 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Profile {
  id: string;
  name: string;
  model: string;
  provider: string;
  instructions: string;
  skills: string;
  temperature: number;
}

export default function ProfilesView() {
  const queryClient = useQueryClient();
  const { org } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  const orgId = org?.id;

  const { data: vaultKeys } = useQuery({
    queryKey: ['vault'],
    queryFn: async () => {
      const res = await api.get<any>('/v1/vault/keys');
      return (res?.data || res || []) as any[];
    },
    enabled: !!orgId,
  });


  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await api.get<any>(`/v1/profiles?orgId=${orgId}`);
      return (res?.profiles || res?.data?.profiles || []) as Profile[];
    },
    enabled: !!orgId,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingProfile) {
        return api.patch(`/v1/profiles/${editingProfile.id}`, data);
      }
      return api.post('/v1/profiles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setIsModalOpen(false);
      setEditingProfile(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/profiles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  });

  if (!orgId) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-noc-border rounded-3xl bg-black/20">
        <p className="text-noc-text2 mono text-xs uppercase italic tracking-widest">No organization context</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold mono text-noc-text1 uppercase tracking-tighter">Agent Profiles</h1>
          <p className="text-xs mono text-noc-text2">Reusable blueprints for agent and reviewer configuration</p>
        </div>
        <Button onClick={() => { setEditingProfile(null); setIsModalOpen(true); }} className="flex items-center gap-2">
          <Plus size={16} /> NEW PROFILE
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center border border-noc-border rounded-2xl bg-noc-bg2">
          <div className="w-6 h-6 border-2 border-noc-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !profiles || profiles.length === 0 ? (
        <div className="h-64 flex items-center justify-center border border-dashed border-noc-border rounded-3xl bg-black/20">
          <div className="text-center">
            <p className="text-noc-text2 mono text-xs uppercase italic tracking-widest">No agent profiles defined</p>
            <div className="mt-4 w-48 h-1 bg-noc-border overflow-hidden rounded-full mx-auto">
              <div className="h-full bg-noc-green animate-progress" style={{ width: '20%' }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {profiles.map((p) => (
            <Card key={p.id} className="p-5 group hover:border-noc-green/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-noc-bg3 border border-noc-border rounded-lg flex items-center justify-center text-noc-green">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mono text-noc-text1">{p.name}</h3>
                    <p className="text-[10px] mono text-noc-text3">{p.provider || 'custom'} / {p.model || 'n/a'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="secondary" className="p-1.5" onClick={() => { setEditingProfile(p); setIsModalOpen(true); }}>
                    <Edit3 size={14} />
                  </Button>
                  <Button variant="danger" className="p-1.5" onClick={() => deleteMutation.mutate(p.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              {p.instructions && (
                <div className="bg-noc-bg3/50 rounded-xl p-3 border border-noc-border mb-3">
                  <p className="text-[10px] mono text-noc-text2 line-clamp-3">{p.instructions}</p>
                </div>
              )}
              <div className="flex gap-4 text-[10px] mono text-noc-text3">
                <span>Temperature: {p.temperature ?? 0.3}</span>
                {p.skills && <span>Skills: {p.skills}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProfile(null); }}
        title={editingProfile ? 'Edit Agent Profile' : 'Create Agent Profile'}>
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          saveMutation.mutate({ orgId, name: fd.get('name'), model: fd.get('model'), provider: fd.get('provider'), instructions: fd.get('instructions'), temperature: parseFloat(fd.get('temperature') as string) || 0.3 });
        }}>
          <Input label="Profile Name" name="name" defaultValue={editingProfile?.name} required />
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Provider" 
              name="provider" 
              defaultValue={editingProfile?.provider}
              options={[
                { value: 'custom', label: 'Custom' },
                ...(vaultKeys?.map(k => ({ value: k.provider, label: k.provider })) || [])
              ]}
            />
            <Input label="Model" name="model" defaultValue={editingProfile?.model} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs mono text-noc-text3 uppercase tracking-wider">Instructions</label>
            <textarea name="instructions" rows={4} defaultValue={editingProfile?.instructions}
              className="bg-noc-bg3 border border-noc-border p-3 text-xs mono text-noc-text1 focus:outline-none focus:border-noc-green transition-colors w-full rounded-lg" />
          </div>
          <Input label="Temperature (0.0 - 1.0)" name="temperature" type="number" step="0.1" defaultValue={String(editingProfile?.temperature ?? 0.3)} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); setEditingProfile(null); }}>CANCEL</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'SAVING...' : editingProfile ? 'UPDATE PROFILE' : 'CREATE PROFILE'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
