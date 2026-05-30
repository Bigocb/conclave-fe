import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Agent } from '../../types/api';
import { Card, Input, Button, Modal } from '../ui/core';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3 } from 'lucide-react';

export default function AgentFactory() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);

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
    <motion.div 
      drag=\"y\"
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragEnd={(event, info) => {
        if (info.offset.y > 80) {
          queryClient.invalidateQueries({ queryKey: ['agents'] });
        }
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className=\"space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500\"\n    >
      <div className=\"flex justify-between items-center\">\n        <div className=\"flex flex-col\">\n          <h1 className=\"text-xl font-bold mono text-noc-text1 uppercase tracking-tighter\">Agent Factory</h1>\n          <p className=\"text-xs mono text-noc-text2\">Provision and manage ephemeral compute nodes</p>\n        </div>\n        <Button \n          onClick={() => { setEditAgent(null); setIsModalOpen(true); }}\n          className=\"flex items-center gap-2\"\n        >\n          <Plus size={16} /> \n          <span className=\"text-xs mono\">REGISTER AGENT</span>\n        </Button>\n      </div>

      {isLoading ? (
        <div className=\"h-64 flex items-center justify-center border border-noc-border rounded-2xl bg-noc-bg2\">\n          <div className=\"w-6 h-6 border-2 border-noc-green border-t-transparent rounded-full animate-spin\" />\n        </div>\n      ) : (
        <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-4\">\n          {agents?.map((agent: any) => (\n            <Card key={agent.id} className=\"p-5 group hover:border-noc-green/50 transition-colors\">\n              <div className=\"flex justify-between items-start mb-4\">\n                <div className=\"flex items-center gap-3\">\n                  <div className=\"w-10 h-10 bg-noc-bg3 border border-noc-border rounded-xl flex items-center justify-center text-noc-green mono text-xs font-bold\">\n                    {agent.type ? agent.type[0].toUpperCase() : 'U'}\n                  </div>\n                  <div className=\"flex flex-col\">\n                    <h3 className=\"text-sm font-bold mono text-noc-text1 truncate max-w-xs\">{agent.name}</h3>\n                    <p className=\"text-[10px] mono text-noc-text3 truncate max-w-xs\">{agent.id}</p>\n                  </div>\n                </div>\n                <div className=\"flex gap-2\">\n                  <Button \n                    variant=\"secondary\" \n                    onClick={() => { setEditAgent(agent); setIsModalOpen(true); }}\n                    className=\"p-2\"\n                  >\n                    <Edit3 size={14} />\n                  </Button>\n                  <Button \n                    variant=\"danger\" \n                    onClick={() => deleteMutation.mutate(agent.id)}\n                    className=\"p-2\"\n                  >\n                    <Trash2 size={14} />\n                  </Button>\n                </div>\n              </div>\n              \n              <div className=\"grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-noc-border\">\n                <div className=\"flex flex-col\">\n                  <p className=\"text-[10px] mono text-noc-text3 uppercase tracking-widest\">Provider/Model</p>\n                  <p className=\"text-xs mono text-noc-text2 truncate\">\n                    {agent.provider || 'custom'} / {agent.model || 'n/a'}\n                  </p>\n                </div>\n                <div className=\"text-right flex flex-col items-end\">\n                  <p className=\"text-[10px] mono text-noc-text3 uppercase tracking-widest\">Status</p>\n                  <p className=\"text-xs mono text-noc-green flex items-center justify-end gap-1\">\n                    <div className=\"w-1.5 h-1.5 bg-noc-green rounded-full\" />\n                    {agent.status ? agent.status.toUpperCase() : 'UNKNOWN'}\n                  </p>\n                </div>\n              </div>\n            </Card>\n          ))}\n        </div>\n      )}

      <Modal \n        isOpen={isModalOpen} \n        onClose={() => setIsModalOpen(false)} \n        title={editAgent ? \"Modify Agent Node\" : \"Provision New Agent\"}\n      >\n        <form \n          className=\"grid grid-cols-2 gap-6\"\n          onSubmit={(e) => {\n            e.preventDefault();\n            const formData = new FormData(e.currentTarget);\n            const data = Object.fromEntries(formData.entries());\n            \n            if (editAgent) {\n              updateMutation.mutate({ id: editAgent.id, data });\n            } else {\n              registerMutation.mutate(data);\n            }\n          }}\n        >\n          <div className=\"col-span-2\">\n            <Input label=\"Agent Name\" name=\"name\" defaultValue={editAgent?.name} required />\n          </div>\n          <div className=\"col-span-1\">\n            <Input \n              label=\"Type\" \n              name=\"type\" \n              defaultValue={editAgent?.type || 'llm'} \n            />\n          </div>\n          <div className=\"col-span-1\">\n            <Input label=\"Provider\" name=\"provider\" defaultValue={editAgent?.provider} />\n          </div>\n          <div className=\"col-span-2\">\n            <Input label=\"Model Identifier\" name=\"model\" defaultValue={editAgent?.model} />\n          </div>\n          <div className=\"col-span-2\">\n            <div className=\"flex flex-col gap-1.5\">\n              <label className=\"text-xs mono text-noc-text3 uppercase tracking-wider\">System Instructions</label>\n              <textarea \n                name=\"instructions\" \n                rows={4}\n                className=\"bg-noc-bg3 border border-noc-border p-2 text-xs mono text-noc-text1 focus:outline-none focus:border-noc-green transition-colors w-full\"\n                defaultValue={editAgent?.instructions}\n              />\n            </div>\n          </div>\n          <div className=\"col-span-2 flex justify-end gap-3 mt-4\">\n            <Button variant=\"secondary\" onClick={() => setIsModalOpen(false)}>CANCEL</Button>\n            <Button type=\"submit\">\n              {editAgent ? 'UPDATE NODE' : 'PROVISION AGENT'}\n            </Button>\n          </div>\n        </form>\n      </Modal>\n    </motion.div>\n  )\n}\n