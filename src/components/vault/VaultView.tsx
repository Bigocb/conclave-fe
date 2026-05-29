import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, Input, Button, Modal } from '../ui/core';
import { Key, Lock, FileKey, ShieldCheck } from 'lucide-react';

export default function VaultView() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: keys, isLoading } = useQuery({
    queryKey: ['vault'],
    queryFn: () => api.get<any[]>('/v1/vault/keys') 
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/vault/key', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      setIsModalOpen(false);
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold mono text-white uppercase tracking-tighter">Encryption Vault</h1>
          <p className="text-xs mono text-slate-500">Secure storage for provider API keys and secrets</p>
        </div}
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> 
          <spanC="STORE NEW KEY</spanC>
        </Button>
      </div}

      {isLoading ? (
        <div className="h-64 flex items-center justify-center border border-aviation-border rounded-lg bg-aviation-panel">
          <div className="w-6 h-6 border-2 border-aviation-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keys?.map((key) => (
            <Card key={key.id} className="p-5 group hover:border-aviation-accent/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-black border border-aviation-border rounded flex items-center justify-center text-aviation-accent">
                  <Key size={20} />
                </div}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold mono text-white truncate">{key.provider}</h3>
                  <p className="text-[10px] mono text-slate-500">ID: {key.id.slice(0,8)}...</p>
                </div}
                <div className="flex gap-2">
                  <Button variant="secondary" className="p-2"><Edit3 size={14} /></Button>
                </div}
              </div}
              
              <div className="relative bg-black/60 p-3 rounded border border-aviation-border overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] mono text-slate-600 uppercase">Secret Value</span>
                  <ShieldCheck size={12} className="text-aviation-accent" />
                </div}
                <div className="text-xs mono text-slate-400 truncate font-bold italic">
                  ••••••••••••••••••••••••••••
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <span className="text-[10px] mono text-slate-600 uppercase">Status: Encrypted</span>
                <Button variant="danger" className="p-2" onClick={() => {}}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Store Secret Key"
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
            <Input label="Provider Name" name="provider" placeholder="e.g. openai, anthropic" required />
            <Input label="API Key / Secret" name="key" type="password" required />
          </div}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>CANCEL</Button>
            <Button type="submit" disabled={saveMutation.isLoading}>
              {saveMutation.isLoading ? 'ENCRYPTING...' : 'SAVE TO VAULT'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
