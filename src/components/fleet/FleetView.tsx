import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { Card, Input, Button, Modal } from '../ui/core';
import { Radio, Cpu, Plus, Trash2, Edit3, Wifi, WifiOff } from 'lucide-react';

interface Reviewer {
  id: string;
  name: string;
  channels: string;
  type: string;
  model: string;
  provider: string;
  mode: string;
  replicas: number;
  confidenceThreshold: number;
  status?: string;
}

interface FleetStatus {
  satellite: string;
  metrics: { activeReviewers: number; totalReplicas: number };
  fleet: { name: string; replicas: number; channel: string }[];
}

export default function FleetView() {
  const queryClient = useQueryClient();
  const { org } = useAuthStore();
  const [isReviewerModal, setIsReviewerModal] = useState(false);
  const [editingReviewer, setEditingReviewer] = useState<Reviewer | null>(null);
  const [isConfigModal, setIsConfigModal] = useState(false);

  const orgId = org?.id;

  const { data: status } = useQuery({
    queryKey: ['fleet', 'status', orgId],
    queryFn: async (): Promise<FleetStatus> => {
      const raw = await api.get<any>(`/v1/fleet/status?orgId=${orgId}`);
      // API returns { status, data: FleetStatus } or just FleetStatus
      return (raw?.data || raw) as FleetStatus;
    },
    enabled: !!orgId,
  });

  const { data: rawReviewers, isLoading: revLoading } = useQuery({
    queryKey: ['fleet', 'reviewers', orgId],
    queryFn: async () => {
      const raw = await api.get<any>(`/v1/fleet/reviewers?orgId=${orgId}`);
      return (raw?.data?.reviewers || raw?.reviewers || raw || []) as Reviewer[];
    },
    enabled: !!orgId,
  });

  const { data: rawConfig } = useQuery({
    queryKey: ['fleet', 'config', orgId],
    queryFn: async () => {
      const raw = await api.get<any>(`/v1/fleet/config?orgId=${orgId}`);
      return (raw?.data || raw) as any;
    },
    enabled: !!orgId,
  });

  const reviewers = rawReviewers || [];
  const config = rawConfig;

  const saveReviewerMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingReviewer) {
        return api.patch(`/v1/fleet/reviewers/${editingReviewer.id}`, data);
      }
      return api.post('/v1/fleet/reviewers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      setIsReviewerModal(false);
      setEditingReviewer(null);
    }
  });

  const deleteReviewerMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/fleet/reviewers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fleet'] }),
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/v1/fleet/config?orgId=${orgId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'config'] });
      setIsConfigModal(false);
    }
  });

  const isOnline = status?.satellite === 'ONLINE';

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
          <h1 className="text-xl font-bold mono text-noc-text1 uppercase tracking-tighter">Fleet Management</h1>
          <p className="text-xs mono text-noc-text2">Satellite reviewer orchestration and health</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsConfigModal(true)} className="flex items-center gap-1.5">
            <Cpu size={14} /> CONFIG
          </Button>
          <Button onClick={() => { setEditingReviewer(null); setIsReviewerModal(true); }} className="flex items-center gap-1.5">
            <Plus size={14} /> ADD REVIEWER
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <div className="w-10 h-10 bg-noc-green/20 border border-noc-green/30 rounded-full flex items-center justify-center">
                <Wifi size={20} className="text-noc-green" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-noc-rose/20 border border-noc-rose/30 rounded-full flex items-center justify-center">
                <WifiOff size={20} className="text-noc-rose" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold mono text-noc-text1">Satellite Relay</h3>
              <p className="text-[10px] mono text-noc-text3">Fleet control plane</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isOnline ? 'bg-noc-green/10 text-noc-green border-noc-green/30' : 'bg-noc-rose/10 text-noc-rose border-noc-rose/30'}`}>
            {status?.satellite || 'OFFLINE'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-noc-bg3/50 rounded-xl p-4 text-center border border-noc-border">
            <p className="text-2xl font-bold mono text-noc-green">{status?.metrics?.activeReviewers || 0}</p>
            <p className="text-[10px] mono text-noc-text3 uppercase tracking-wider mt-1">Reviewers</p>
          </div>
          <div className="bg-noc-bg3/50 rounded-xl p-4 text-center border border-noc-border">
            <p className="text-2xl font-bold mono text-noc-text1">{status?.metrics?.totalReplicas || 0}</p>
            <p className="text-[10px] mono text-noc-text3 uppercase tracking-wider mt-1">Total Replicas</p>
          </div>
          <div className="bg-noc-bg3/50 rounded-xl p-4 text-center border border-noc-border">
            <p className="text-2xl font-bold mono text-noc-amber">{config?.server || 'default'}</p>
            <p className="text-[10px] mono text-noc-text3 uppercase tracking-wider mt-1">Server Mode</p>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-xs mono text-noc-text3 uppercase tracking-[0.2em] font-bold mb-4">Reviewer Blueprints</h2>
        {revLoading ? (
          <div className="h-32 flex items-center justify-center border border-noc-border rounded-2xl bg-noc-bg2">
            <div className="w-5 h-5 border-2 border-noc-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !reviewers || reviewers.length === 0 ? (
          <div className="h-32 flex items-center justify-center border border-dashed border-noc-border rounded-2xl bg-black/20">
            <p className="text-noc-text2 mono text-xs italic">No reviewer blueprints configured</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reviewers.map((r) => (
              <Card key={r.id} className="p-5 group hover:border-noc-green/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-noc-bg3 border border-noc-border rounded-lg flex items-center justify-center text-noc-cyan">
                      <Radio size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold mono text-noc-text1">{r.name}</h3>
                      <p className="text-[10px] mono text-noc-text3">{r.type}/{r.model || r.provider || 'custom'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="secondary" className="p-1.5" onClick={() => { setEditingReviewer(r); setIsReviewerModal(true); }}>
                      <Edit3 size={14} />
                    </Button>
                    <Button variant="danger" className="p-1.5" onClick={() => deleteReviewerMutation.mutate(r.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-[10px] mono text-noc-text3">
                  <span>Replicas: {r.replicas}</span>
                  <span>Mode: {r.mode}</span>
                  <span>Confidence: {r.confidenceThreshold}/10</span>
                </div>
                {r.channels && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {JSON.parse(r.channels).map((ch: string) => (
                      <span key={ch} className="text-[9px] px-1.5 py-0.5 bg-noc-bg3 rounded border border-noc-border text-noc-text2">{ch}</span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isReviewerModal} onClose={() => { setIsReviewerModal(false); setEditingReviewer(null); }}
        title={editingReviewer ? 'Edit Reviewer Blueprint' : 'New Reviewer Blueprint'}>
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const channels = (fd.get('channels') as string).split(',').map(s => s.trim()).filter(Boolean);
          saveReviewerMutation.mutate({ orgId, name: fd.get('name'), channels, type: fd.get('type'), model: fd.get('model'), provider: fd.get('provider'), mode: fd.get('mode'), replicas: parseInt(fd.get('replicas') as string) || 1, confidenceThreshold: parseInt(fd.get('confidence') as string) || 8 });
        }}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Blueprint Name" name="name" defaultValue={editingReviewer?.name} required />
            <Input label="Channels (comma-sep)" name="channels" defaultValue={editingReviewer?.channels ? JSON.parse(editingReviewer.channels).join(', ') : 'code-review'} required />
            <Input label="Type" name="type" defaultValue={editingReviewer?.type || 'llm'} />
            <Input label="Provider" name="provider" defaultValue={editingReviewer?.provider} />
            <Input label="Model" name="model" defaultValue={editingReviewer?.model} />
            <Input label="Mode (auto/manual)" name="mode" defaultValue={editingReviewer?.mode || 'auto'} />
            <Input label="Replicas" name="replicas" type="number" defaultValue={String(editingReviewer?.replicas || 1)} />
            <Input label="Confidence Threshold" name="confidence" type="number" defaultValue={String(editingReviewer?.confidenceThreshold || 8)} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setIsReviewerModal(false); setEditingReviewer(null); }}>CANCEL</Button>
            <Button type="submit" disabled={saveReviewerMutation.isPending}>
              {saveReviewerMutation.isPending ? 'SAVING...' : editingReviewer ? 'UPDATE BLUEPRINT' : 'CREATE BLUEPRINT'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isConfigModal} onClose={() => setIsConfigModal(false)} title="Fleet Configuration">
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          updateConfigMutation.mutate({ server: fd.get('server'), scope: fd.get('scope') });
        }}>
          <Input label="Server Mode" name="server" defaultValue={config?.server || 'default'} />
          <Input label="Scope" name="scope" defaultValue={config?.scope || 'org'} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsConfigModal(false)}>CANCEL</Button>
            <Button type="submit" disabled={updateConfigMutation.isPending}>
              {updateConfigMutation.isPending ? 'SAVING...' : 'UPDATE CONFIG'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
