import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';
import { Button } from '../ui/core';
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
      
      if (!response) throw new Error('Server returned an empty response');

      const orgId = response.orgId || 'unknown';
      const token = response.token;
      const user = response.user;

      if (!token) throw new Error('Authentication successful but no token was provided');

      // Persist auth state to localStorage for page reload
      localStorage.setItem('access_token', token);
      localStorage.setItem('orgId', orgId);
      if (user?.id) localStorage.setItem('userId', user.id);
      if (user?.email) localStorage.setItem('userEmail', user.email);

      api.setToken(token);
      api.setOrgId(orgId);

      try {
        const orgData = await api.get('/v1/orgs/' + orgId);
        setAuth(token, user, undefined, undefined, orgData as any);
      } catch (err) {
        console.error('[Login] Failed to fetch org details:', err);
        setAuth(token, user, undefined, undefined, { 
          id: orgId, 
          name: 'Conclave Org', 
          slug: orgId, 
          policies: { min_reviews_required: 0 } 
        } as any);
      }
      window.location.reload(); 
    } catch (err: any) {
      console.error('[Login] Error:', err);
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-noc-bg flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-noc-bg2 border border-noc-border p-10 rounded-3xl shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-noc-green/10 border border-noc-green/30 rounded-full flex items-center justify-center mx-auto mb-6 text-noc-green">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-bold text-noc-text1 uppercase tracking-tighter mb-2">Conclave Access</h2>
          <p className="text-noc-text3 text-[10px] uppercase tracking-[0.3em] mono">Network Authentication Protocol</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-8">
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-noc-text3 uppercase tracking-widest font-bold mono">Network Identity (Email)</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="bg-noc-bg3 border border-noc-border p-3 text-sm text-noc-text1 focus:outline-none focus:border-noc-green transition-colors w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-noc-text3 uppercase tracking-widest font-bold mono">Access Key</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="bg-noc-bg3 border border-noc-border p-3 text-sm text-noc-text1 focus:outline-none focus:border-noc-green transition-colors w-full"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-noc-rose/10 border border-noc-rose/20 rounded text-noc-rose text-[10px] mono uppercase text-center font-bold">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 tracking-[0.2em] text-sm"
          >
            {isLoading ? 'AUTHENTICATING...' : 'ESTABLISH CONNECTION'}
          </Button>
        </form>

        <div className="mt-10 pt-6 border-t border-noc-border text-center">
          <p className="text-[9px] text-noc-text3 uppercase tracking-widest opacity-60">
            Authorized personnel only. All activity is logged.
          </p>
        </div>
      </div>
    </div>
  );
}