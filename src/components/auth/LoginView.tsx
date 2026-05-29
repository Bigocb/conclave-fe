import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';
import { Input, Button } from '../ui/core';
import { Lock } from 'lucide-react';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<{ token: string, user: any, orgId: string }>('/v1/auth/login', {
        email,
        password
      });
      
      if (!response) {
        throw new Error('Server returned an empty response');
      }

      const orgId = response.orgId || 'unknown';
      const token = response.token;
      const user = response.user;

      if (!token) {
        throw new Error('Authentication successful but no token was provided');
      }

      const syntheticOrg = { 
        id: orgId, 
        name: 'My Organization',
        slug: 'my-org',
        policies: {
          min_reviews_required: 0
        }
      };
      
      api.setOrgId(orgId);
      setAuth(token, user, undefined, undefined, syntheticOrg);
      window.location.reload(); 
    } catch (err: any) {
      console.error('[Login] Error:', err);
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-aviation-bg flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-aviation-panel border border-aviation-border p-8 rounded-lg noc-glow shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-aviation-accent/10 border border-aviation-accent/30 rounded-full flex items-center justify-center mx-auto mb-4 text-aviation-accent">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold mono text-white uppercase tracking-tighter">Conclave Access</h2>
          <p className="text-slate-500 text-[10px] mono mt-2 uppercase tracking-[0.2em]">Network Authentication Protocol</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <Input 
                label="Network Identity (Email)" 
                name="email" 
                type="email" 
                value={email} 
                onChange={(e: any) => setEmail(e.target.value)} 
                required 
                className="pl-2"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Input 
                label="Access Key" 
                name="password" 
                type="password" 
                value={password} 
                onChange={(e: any) => setPassword(e.target.value)} 
                required 
                className="pl-2"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-[10px] mono uppercase text-center font-bold">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 tracking-widest"
          >
            {isLoading ? 'AUTHENTICATING...' : 'ESTABLISH CONNECTION'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-aviation-border text-center">
          <p className="text-[9px] mono text-slate-600 uppercase tracking-widest opacity-60">
            Authorized personnel only. All activity is logged.
          </p>
        </div>
      </div>
    </div>
  );
}
