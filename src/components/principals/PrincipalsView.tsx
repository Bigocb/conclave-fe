import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Principal } from '../../types/api';
import { Card, Input, Button, Modal } from '../ui/core';
import { UserCircle, DollarSign, TrendingUp, Plus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

type ModalMode = 'view' | 'create' | 'grant';

export default function PrincipalsView() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('view');
  const [activePrincipal, setActivePrincipal] = useState<Principal | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { org } = useAuthStore();

  const { data: principals, isLoading } = useQuery({
    queryKey: ['principals'],
    queryFn: () => api.get<Principal[]>('/v1/principals') 
  });

  const grantMutation = useMutation({
    mutationFn: ({ id, amount, reason }: { id: string, amount: number, reason: string }) => 
      api.post(`/v1/principals/${id}/budget/grant`, { amount, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['principals'] });
      setIsModalOpen(false);
      setModalMode('view');
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string, roles: string[] }) => 
      api.post('/v1/principals', { ...data, org_id: org?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['principals'] });
      setIsModalOpen(false);
      setModalMode('view');
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error?.message || err?.message || 'Failed to create principal');
    }
  });

  const openCreateModal = () => {
    setActivePrincipal(null);
    setModalMode('create');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openGrantModal = (principal: Principal) => {
    setActivePrincipal(principal);
    setModalMode('grant');
    setFormError(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold mono text-noc-text1 uppercase tracking-tighter">Principal Directory</h1>
          <p className="text-xs mono text-noc-text2">Manage network identities and attention budgets</p>
        </div>
        <Button className="flex items-center gap-2" onClick={openCreateModal}>
          <Plus size={16} /> 
          <span className="text-xs mono">CREATE PRINCIPAL</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center border border-noc-border rounded-2xl bg-noc-bg2">
          <div className="w-6 h-6 border-2 border-noc-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {principals?.map((p: any) => (
            <Card key={p.id} className="p-5 group hover:border-noc-green/50 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2">
                <div className="text-[10px] mono text-noc-text3 bg-black/40 px-2 py-0.5 rounded border border-noc-border">
                  {p.id.slice(0, 8)}...
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-noc-bg3 border border-noc-border rounded-full flex items-center justify-center text-noc-green">
                  <UserCircle size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold mono text-noc-text1">{p.name}</h3>
                  <div className="flex gap-2 mt-1">
                    {p.roles?.map((role: any) => (
                      <span key={role} className="text-[9px] mono bg-noc-green/10 text-noc-green px-1 rounded border border-noc-green/20">
                        {role.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-noc-bg/60 p-3 rounded-xl border border-noc-border">
                  <div className="flex items-center gap-2 text-noc-text3 mb-1">
                    <DollarSign size={12} />
                    <span className="text-[10px] mono uppercase">Budget Balance</span>
                  </div>
                  <div className="text-lg font-bold mono text-noc-text1">{p.budget} <span className="text-xs text-noc-text3 uppercase">Credits</span></div>
                </div>
                <div className="bg-noc-bg/60 p-3 rounded-xl border border-noc-border">
                  <div className="flex items-center gap-2 text-noc-text3 mb-1">
                    <TrendingUp size={12} />
                    <span className="text-[10px] mono uppercase">Reputation</span>
                  </div>
                  <div className="text-lg font-bold mono text-noc-green">{p.reputation}%</div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button 
                  variant="secondary" 
                  className="text-[10px] px-3"
                  onClick={() => openGrantModal(p)}
                >
                  GRANT BUDGET
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setModalMode('view'); }} 
        title={
          modalMode === 'create' ? 'Create Principal' :
          modalMode === 'grant' ? `Grant Budget: ${activePrincipal?.name}` :
          'Principal'
        }
      >
        {modalMode === 'create' && (
          <form 
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              setFormError(null);
              const formData = new FormData(e.currentTarget);
              const name = (formData.get('name') as string).trim();
              if (!name) {
                setFormError('Name is required');
                return;
              }
              const roles = (formData.get('roles') as string).split(',').map(r => r.trim()).filter(Boolean);
              createMutation.mutate({ name, roles: roles.length ? roles : ['general-reviewer'] });
            }}
          >
            {formError && (
              <div className="p-3 bg-noc-rose/10 border border-noc-rose/30 rounded-xl">
                <p className="text-xs text-noc-rose font-bold">{formError}</p>
              </div>
            )}
            <Input label="Name" name="name" placeholder="e.g. RevivedBigocb" required />
            <Input label="Roles (comma-separated)" name="roles" placeholder="e.g. general-reviewer, code-reviewer" />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => { setIsModalOpen(false); setModalMode('view'); }}>CANCEL</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'CREATING...' : 'CREATE PRINCIPAL'}
              </Button>
            </div>
          </form>
        )}

        {modalMode === 'grant' && activePrincipal && (
          <form 
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              grantMutation.mutate({ 
                id: activePrincipal.id, 
                amount: parseFloat(formData.get('amount') as string), 
                reason: formData.get('reason') as string 
              });
            }}
          >
            <div className="grid grid-cols-1 gap-4">
              <Input label="Amount to Grant" name="amount" type="number" step="0.01" required />
              <Input label="Reason" name="reason" placeholder="e.g. Monthly allocation" required />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => { setIsModalOpen(false); setModalMode('view'); }}>CANCEL</Button>
              <Button type="submit" disabled={grantMutation.isPending}>
                {grantMutation.isPending ? 'PROCESSING...' : 'CONFIRM GRANT'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
