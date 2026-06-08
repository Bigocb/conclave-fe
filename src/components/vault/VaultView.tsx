import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, Input, Button, Modal } from '../ui/core';
import { Key, ShieldCheck, Plus, Trash2, Edit3 } from 'lucide-react';

export default function VaultView() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<{ id: string; provider: string } | null>(null);

  const { data: keys, isLoading, error } = useQuery({
    queryKey: ['vault'],
    queryFn: async () => {
      const res = await api.get<any>('/v1/vault/keys');
      return (res?.data || res || []) as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/vault/key', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      setIsModalOpen(false);
      setEditingKey(null);
    }
  });

  const handleEdit = (key: any) => {
    setEditingKey({ id: key.id, provider: key.provider });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingKey(null);
    setIsModalOpen(true);
  };

  if (error) {
    return <div className="p-8 text-noc-rose mono text-xs uppercase font-bold">Vault Access Error: {error.message}</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold mono text-noc-text1 uppercase tracking-tighter">Encryption Vault</h1>
          <p className="text-xs mono text-noc-text2">Secure storage for provider API keys and secrets</p>
        </div>
        <Button 
          onClick={handleAddNew}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> 
          <span className="text-xs mono">STORE NEW KEY</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center border border-noc-border rounded-2xl bg-noc-bg2">
          <div className="w-6 h-6 border-2 border-noc-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keys && keys.length > 0 ? (
            keys.map((key: any, idx: number) => (
              <Card key={key.id || idx} className="p-5 group hover:border-noc-green/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-noc-bg3 border border-noc-border rounded-xl flex items-center justify-center text-noc-green">
                    <Key size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold mono text-noc-text1 truncate">{key.provider || 'Unknown Provider'}</h3>
                    <p className="text-[10px] mono text-noc-text3">ID: {key.id ? String(key.id).slice(0,8) : 'n/a'}...</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="p-2" onClick={() => handleEdit(key)}>
                      <Edit3 size={14} />
                    </Button>
                  </div>
                </div>
                
                <div className="relative bg-noc-bg3/60 p-3 rounded-xl border border-noc-border overflow-hidden">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] mono text-noc-text3 uppercase">Secret Value</span>
                    <ShieldCheck size={12} className="text-noc-green" />
                  </div>
                  <div className="text-xs mono text-noc-text2 truncate font-bold italic">
                    ••••••••••••••••••••••••••••
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-[10px] mono text-noc-text3 uppercase">Status: Encrypted</span>
                  <Button variant="danger" className="p-2" onClick={() => {}}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-noc-text2 mono text-xs uppercase">
              No keys found in vault.
            </div>
          )}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingKey(null); }} 
        title={editingKey ? `Update Key: ${editingKey.provider}` : "Store Secret Key"}
      >
        <form 
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            saveMutation.mutate({ 
              provider: formData.get('provider') as string, 
              key: formData.get('key') as string 
            });
          }}
        >
          <div className="grid grid-cols-1 gap-4">
            <Input 
              label="Provider Name" 
              name="provider" 
              placeholder="e.g. openai, anthropic" 
              defaultValue={editingKey?.provider || ''}
              disabled={!!editingKey}
              required 
            />
            <Input 
              label={editingKey ? "New API Key / Secret (replaces current)" : "API Key / Secret"} 
              name="key" 
              type="password" 
              required={!editingKey}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); setEditingKey(null); }}>CANCEL</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'ENCRYPTING...' : editingKey ? 'UPDATE KEY' : 'SAVE TO VAULT'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}