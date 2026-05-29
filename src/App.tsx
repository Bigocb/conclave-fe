import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Activity, ShieldAlert, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';
import { usePulse } from './hooks/usePulse';
import AgentFactory from './components/factory/AgentFactory';
import PrincipalsView from './components/principals/PrincipalsView';
import VaultView from './components/vault/VaultView';
import LoginView from './components/auth/LoginView';
import { MobileNav } from './components/ui/MobileNav';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: SidebarItemProps) => (
  <div 
    onClick={onClick} 
    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 rounded-lg ${active ? 'bg-aviation-accent/10 text-aviation-accent font-semibold shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
  >
    <Icon size={18} className={active ? 'text-aviation-accent' : ''} />
    <span className="text-sm tracking-tight">{label}</span>
  </div>
);

export default function App() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { agent, org, user } = useAuthStore();
  const { status } = usePulse();
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-aviation-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-aviation-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] mono text-slate-500 uppercase tracking-widest font-bold">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const views = [
    { id: 'dashboard', label: 'Fleet Overview', icon: LayoutDashboard },
    { id: 'factory', label: 'Agent Factory', icon: Users },
    { id: 'principals', label: 'Principals', icon: UserCircle },
    { id: 'feed', label: 'Task Feed', icon: Activity },
    { id: 'vault', label: 'Trust Vault', icon: ShieldAlert },
  ];

  const renderDashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="col-span-1 lg:col-span-2 p-8 bg-aviation-panel border border-aviation-border rounded-2xl relative">
        <h2 className="text-lg font-bold text-white mb-6">Organization Overview</h2>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">{org?.name || org?.id || 'TheOrg'}</div>
          <div className="hidden md:block h-12 w-px bg-aviation-border" />
          <div className="text-sm text-slate-400 uppercase tracking-wide leading-relaxed">Secure Node <br /> Active Cluster</div>
        </div>
      </div>
      <div className="p-8 bg-aviation-panel border border-aviation-border rounded-2xl">
        <h2 className="text-lg font-bold text-white mb-6">System Health</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm group">
            <span className="text-slate-400 group-hover:text-slate-200 transition-colors">API Latency</span>
            <span className="text-aviation-accent font-bold bg-aviation-accent/10 px-3 py-1 rounded-full border border-aviation-accent/20">14ms</span>
          </div>
          <div className="flex justify-between items-center text-sm group">
            <span className="text-slate-400 group-hover:text-slate-200 transition-colors">Pulse Stream</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${status === 'connected' ? 'text-aviation-accent bg-aviation-accent/10 border-aviation-accent/20' : 'text-red-400 bg-red-400/10 border-red-400/20'} uppercase`}>{status}</span>
          </div>
          <div className="flex justify-between items-center text-sm group">
            <span className="text-slate-400 group-hover:text-slate-200 transition-colors">Worker Load</span>
            <span className="text-amber-400 font-bold bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 uppercase">Moderate</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderView = () => {
    if (activeView === 'dashboard') return renderDashboard();
    if (activeView === 'factory') return <AgentFactory />;
    if (activeView === 'principals') return <PrincipalsView />;
    if (activeView === 'vault') return <VaultView />;
    return (
      <div className="h-full flex items-center justify-center border border-dashed border-aviation-border rounded-2xl bg-black/20">
        <div className="text-center">
          <p className="text-slate-500 mono text-xs uppercase italic tracking-widest">Module {activeView} loading...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-aviation-bg text-slate-200 overflow-hidden">
      {!isMobile && (
        <aside className="w-64 bg-aviation-panel border-r border-aviation-border flex flex-col shadow-xl">
          <div className="p-6 border-b border-aviation-border bg-black/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-aviation-accent rounded flex items-center justify-center text-black font-bold text-xs">C</div>
              <span className="font-bold text-lg tracking-tight text-white">Conclave</span>
            </div>
          </div>
          <nav className="flex-1 py-6 px-3 space-y-1">
            {views.map(v => (<SidebarItem key={v.id} icon={v.icon} label={v.label} active={activeView === v.id} onClick={() => setActiveView(v.id)} />))}
          </nav>
          <div className="p-4 border-t border-aviation-border flex flex-col gap-4 bg-black/20">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-2 h-2 bg-aviation-accent rounded-full" />
              <span className="truncate text-xs mono font-bold text-slate-300">{user?.name || agent?.name || 'Unknown Identity'}</span>
            </div>
            <button onClick={logout} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:text-white transition-all duration-200 group">
              <LogOut size={16} className="group-hover:text-white transition-colors" />
              <span className="uppercase tracking-widest text-[10px] font-bold">Logout</span>
            </button>
          </div>
        </aside>
      )}
      
      {isMobile && (
        <MobileNav currentView={activeView} setView={setActiveView} />
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-aviation-border flex items-center justify-between px-8 bg-aviation-panel shadow-sm">
          <div className="text-xs mono text-slate-500 uppercase tracking-widest font-bold">System // {activeView}</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-aviation-border">
              <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-aviation-accent animate-ping' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-[10px] mono text-aviation-accent uppercase font-bold tracking-tighter">Pulse {status}</span>
            </div>
            {isMobile && (
              <button onClick={logout} className="md:hidden p-2 text-slate-500 hover:text-white transition-colors">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </header>
        <section className="flex-1 p-8 overflow-auto bg-aviation-bg pb-20 md:pb-8">
          {renderView()}
        </section>
      </main>
    </div>
  );
}
