import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Principal } from '../../types/api';
import { Card, Input, Button, Modal } from '../ui/core';
import { UserCircle, DollarSign, TrendingUp, Plus, Edit3 } from 'lucide-react';

export default function PrincipalsView() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePrincipal, setActivePrincipal] = useState<Principal | null>(null);

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
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold mono text-noc-text1 uppercase tracking-tighter">Principal Directory</h1>
          <p className="text-xs mono text-noc-text2">Manage network identities and attention budgets</p>
        </div>
        <Button className="flex items-center gap-2">
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
                  onClick={() => { setActivePrincipal(p); setIsModalOpen(true); }}
                >
                  GRANT BUDGET
                </Button>
                <Button variant="secondary" className="p-2"><Edit3 size={14} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={activePrincipal ? `Grant Budget: ${activePrincipal.name}` : "Grant Budget"}
      >
        <form 
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            grantMutation.mutate({ 
              id: activePrincipal!.id, 
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
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>CANCEL</Button>
            <Button type="submit" disabled={grantMutation.isPending}>
              {grantMutation.isPending ? 'PROCESSING...' : 'CONFIRM GRANT'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
