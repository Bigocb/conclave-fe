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
    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 ${active ? 'bg-aviation-accent/10 text-aviation-accent border-r-2 border-aviation-accent shadow-[inset_0_0_10px_rgba(0,217,139,0.1)]' : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'}`}
  >
    <Icon size={18} className={active ? 'animate-pulse' : ''} />
    <span className="text-xs font-bold mono tracking-wider uppercase">{label}</span>
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
          <span className="text-[9px] mono text-slate-500 uppercase tracking-[0.3em] font-bold">Authenticating Agent...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const views = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'factory', label: 'Agent Factory', icon: Users },
    { id: 'principals', label: 'Principals', icon: UserCircle },
    { id: 'feed', label: 'Pulse Feed', icon: Activity },
    { id: 'vault', label: 'Vault', icon: ShieldAlert },
  ];

  const renderDashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="col-span-1 lg:col-span-2 h-auto lg:h-64 bg-aviation-panel border border-aviation-border rounded-sm p-6 noc-glow relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2">
          <span className="text-[8px] mono text-slate-600 uppercase tracking-widest font-bold">Org Context // active</span>
        </div>
        <h2 className="text-xs mono text-slate-500 mb-6 uppercase tracking-widest font-bold">Organization Overview</h2>
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="text-4xl md:text-6xl font-black mono text-white tracking-tighter italic">{org?.name || org?.id || 'TheOrg'}</div>
          <div className="hidden md:block h-12 w-px bg-aviation-border" />
          <div className="text-xs mono text-slate-500 uppercase tracking-widest leading-relaxed opacity-70">Secure Node <br /> Active Cluster</div>
        </div>
      </div>
      <div className="h-auto lg:h-64 bg-aviation-panel border border-aviation-border rounded-sm p-6 shadow-sm">
        <h2 className="text-xs mono text-slate-500 mb-4 uppercase tracking-widest font-bold">System Health</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs mono group">
            <span className="text-slate-500 group-hover:text-slate-300 transition-colors">API Latency</span>
            <span className="text-aviation-accent font-bold bg-aviation-accent/5 px-2 py-0.5 rounded border border-aviation-accent/20">14ms</span>
          </div>
          <div className="flex justify-between items-center text-xs mono group">
            <span className="text-slate-500 group-hover:text-slate-300 transition-colors">Pulse Stream</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${status === 'connected' ? 'text-aviation-accent bg-aviation-accent/5 border-aviation-accent/20' : 'text-red-500 bg-red-500/5 border-red-500/20'} uppercase`}>{status}</span>
          </div>
          <div className="flex justify-between items-center text-xs mono group">
            <span className="text-slate-500 group-hover:text-slate-300 transition-colors">Worker Load</span>
            <span className="text-amber-500 font-bold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/20 uppercase">Moderate</span>
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
      <div className="h-full flex items-center justify-center border border-dashed border-aviation-border rounded-sm bg-black/20">
        <div className="text-center">
          <p className="text-slate-500 mono text-[10px] uppercase italic tracking-widest">Module {activeView} loading...</p>
          <div className="mt-4 w-48 h-1 bg-aviation-border overflow-hidden rounded-full">
            <div className="h-full bg-aviation-accent animate-progress" style={{ width: '40%' }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-aviation-bg text-slate-200 overflow-hidden font-mono">
      {!isMobile && (
        <aside className="w-64 bg-aviation-panel border-r border-aviation-border flex flex-col shadow-2xl">
          <div className="p-6 border-b border-aviation-border bg-black/40">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-aviation-accent rounded-full animate-pulse" />
              <h1 className="text-sm font-black mono tracking-tighter text-white uppercase">Conclave <span className="text-aviation-accent">v2</span></h1>
            </div>
          </div>
          <nav className="flex-1 py-6">
            {views.map(v => (<SidebarItem key={v.id} icon={v.icon} label={v.label} active={activeView === v.id} onClick={() => setActiveView(v.id)} />))}
          </nav>
          <div className="p-4 border-t border-aviation-border flex flex-col gap-4 bg-black/40">
            <div className="flex items-center gap-3 px-2 py-1 text-xs mono text-slate-400 bg-black/60 rounded border border-aviation-border">
              <div className="w-2 h-2 bg-aviation-accent rounded-full" />
              <span className="truncate font-bold">{user?.name || agent?.name || 'Unknown Identity'}</span>
            </div>
            <button onClick={logout} className="flex items-center gap-3 px-4 py-2 text-xs mono text-slate-500 hover:text-red-400 transition-all duration-200">
              <LogOut size={14} />
              <span className="uppercase tracking-widest text-[9px] font-bold">Disconnect</span>
            </button>
          </div>
        </aside>
      )}
      
      {isMobile && (
        <MobileNav currentView={activeView} setView={setActiveView} />
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-aviation-border flex items-center justify-between px-4 md:px-8 bg-aviation-panel shadow-md">
          <div className="text-xs mono text-slate-500 uppercase tracking-[0.3em] font-bold">System // {activeView}</div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-black/60 rounded border border-aviation-border">
              <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-aviation-accent animate-ping' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-[9px] md:text-[10px] mono text-aviation-accent uppercase font-bold tracking-tighter">Pulse {status}</span>
            </div>
            {isMobile && (
              <button onClick={logout} className="md:hidden p-2 text-slate-500 hover:text-red-400 transition-colors">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </header>
        <section className="flex-1 p-4 md:p-8 overflow-auto bg-aviation-bg pb-20 md:pb-8">
          {renderView()}
        </section>
      </main>
    </div>
  );
}
