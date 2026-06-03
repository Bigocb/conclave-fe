import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, Input, Button, Modal, Select } from '../ui/core';
import { Brain, Plus, Trash2, Search, RefreshCw } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'convention', label: 'Convention' },
  { value: 'preference', label: 'Preference' },
  { value: 'fact', label: 'Fact' },
  { value: 'general', label: 'General' },
];

export default function MemoryView() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMemory, setEditingMemory] = useState<any>(null);

  const { data: memories, isLoading, error, refetch } = useQuery({
    queryKey: ['memories', selectedCategory],
    queryFn: async () => {
      const data = await api.getMemories(selectedCategory || undefined);
      return data as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; category?: string }) => {
      return api.createMemory(data.key, data.value, data.category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      setIsModalOpen(false);
      setEditingMemory(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => api.deleteMemory(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });

  const handleSearch = async () => {
    if (searchQuery.trim().length >= 2) {
      const results = await api.searchMemories(searchQuery);
      queryClient.setQueryData(['memories', selectedCategory], results);
    } else {
      refetch();
    }
  };

  const filteredMemories = searchQuery.trim().length >= 2 
    ? memories // Already filtered by search in the view
    : memories;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'convention': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'preference': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'fact': return 'text-green-400 bg-green-400/10 border-green-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  if (error) {
    return (
      <div className="p-8 text-noc-rose mono text-xs uppercase font-bold">
        Memory Access Error: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold mono text-noc-text1 uppercase tracking-tighter flex items-center gap-3">
            <Brain size={24} className="text-noc-green" />
            Principal Memory
          </h1>
          <p className="text-xs mono text-noc-text2">Knowledge and conventions learned from reviews</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => refetch()}>
            <RefreshCw size={16} />
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span className="text-xs mono ml-2">NEW MEMORY</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="flex gap-2">
            <input
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-noc-bg3 border border-noc-border p-2 text-xs mono text-noc-text1 focus:outline-none focus:border-noc-green transition-colors rounded-lg"
            />
            <Button variant="secondary" onClick={handleSearch}>
              <Search size={16} />
            </Button>
          </div>
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSearchQuery('');
          }}
          className="bg-noc-bg3 border border-noc-border p-2 text-xs mono text-noc-text1 focus:outline-none focus:border-noc-green transition-colors rounded-lg w-48"
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Memory List */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center border border-noc-border rounded-2xl bg-noc-bg2">
          <div className="w-6 h-6 border-2 border-noc-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories && filteredMemories.length > 0 ? (
            filteredMemories.map((memory: any, idx: number) => (
              <Card key={memory.id || memory.key || idx} className="p-5 group hover:border-noc-green/50 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border mono uppercase ${getCategoryColor(memory.category)}`}>
                        {memory.category || 'general'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold mono text-noc-text1 truncate">{memory.key}</h3>
                    <p className="text-[10px] mono text-noc-text3">
                      {memory.created_at ? new Date(memory.created_at).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="secondary" 
                      className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteMutation.mutate(memory.key)}
                    >
                      <Trash2 size={14} className="text-noc-rose" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-noc-bg3/60 p-3 rounded-xl border border-noc-border">
                  <p className="text-xs mono text-noc-text2 break-words whitespace-pre-wrap line-clamp-4">
                    {memory.value}
                  </p>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-noc-text3">
              <Brain size={48} className="mb-4 opacity-30" />
              <p className="text-sm mono uppercase tracking-widest">No memories found</p>
              <p className="text-xs mono mt-2 opacity-60">
                {selectedCategory ? 'Try a different category' : 'Create your first memory to get started'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingMemory(null); }} title="Memory Entry">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            saveMutation.mutate({
              key: formData.get('key') as string,
              value: formData.get('value') as string,
              category: formData.get('category') as string || undefined,
            });
          }}
          className="space-y-4"
        >
          <Input
            label="Key"
            name="key"
            placeholder="e.g., convention:typescript:formatting"
            defaultValue={editingMemory?.key}
            required
          />
          <div>
            <label className="block text-xs mono text-noc-text3 uppercase mb-2">Value</label>
            <textarea
              name="value"
              rows={4}
              defaultValue={editingMemory?.value}
              className="w-full bg-noc-bg3 border border-noc-border rounded-xl p-3 text-sm mono text-noc-text1 focus:border-noc-green focus:outline-none"
              placeholder="Memory content..."
              required
            />
          </div>
          <Select
            label="Category"
            name="category"
            options={CATEGORIES.slice(1)}
            defaultValue={editingMemory?.category || 'general'}
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setEditingMemory(null); }} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Memory'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
