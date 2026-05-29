import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Activity, ShieldAlert, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';
import { usePulse } from './hooks/usePulse';
import AgentFactory from './components/factory/AgentFactory';
import PrincipalsView from './components/principals/PrincipalsView';
import VaultView from './components/vault/VaultView';
import LoginView from './components/auth/LoginView';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: SidebarItemProps) => (

  <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 ${active ? 'bg-aviation-accent/10 text-aviation-accent border-r-2 border-aviation-accent' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>

    <Icon size={20} />

    <span className="text-sm font-medium mono">{label}</span>>

  </div>>

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
    return (<div className="h-screen w-full bg-aviation-bg flex items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-aviation-accent border-t-transparent rounded-full animate-spin" /><span className="text-xs mono text-slate-500 uppercase tracking-widest">Authenticating Agent...</span>></div>></div>>);
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const views = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'factory', label: 'AGENT FACTORY', icon: Users },
    { id: 'principals', label: 'PRINCIPALS', icon: UserCircle },
    { id: 'feed', label: 'PULSE FEED', icon: Activity },
    { id: 'vault', label: 'VAULT', icon: ShieldAlert },
  ];

  const renderDashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="col-span-1 lg:col-span-2 h-auto lg:h-64 bg-aviation-panel border border-aviation-border rounded-lg p-6 md:p-8 noc-glow relative overflow-hidden shadow-inner">
        <div className="absolute top-0 right-0 p-3"><span className="text-[9px] mono text-slate-600 uppercase tracking-widest">Org Context</span>></div>>
        <h2 className="text-sm mono text-slate-500 mb-6 md:mb-8 uppercase tracking-widest font-bold">Organization Overview</h2>
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="text-4xl md:text-6xl font-black mono text-white tracking-tighter">{org?.name || org?.id || 'TheOrg'}</div>>
          <div className="hidden md:block h-12 w-px bg-aviation-border" />
          <div className="text-xs mono text-slate-500 uppercase tracking-widest leading-relaxed">Secure Node <br /> Active Cluster</div>>
        </div>>
      </div>>
      <div className="h-auto lg:h-64 bg-aviation-panel border border-aviation-border rounded-lg p-6 md:p-8 shadow-sm">
        <h2 className="text-sm mono text-slate-500 mb-4 md:mb-6 uppercase tracking-widest font-bold">System Health</h2>
        <div className="space-y-4 md:space-y-5">
          <div className="flex justify-between items-center text-xs mono group"><span className="text-slate-500 group-hover:text-slate-300 transition-colors">API Latency</span>><span className="text-aviation-accent font-bold bg-aviation-accent/10 px-2 py-0.5 rounded border border-aviation-accent/20">14ms</span>></div>>
          <div className="flex justify-between items-center text-xs mono group"><span className="text-slate-500 group-hover:text-slate-300 transition-colors">Pulse Stream</span>><span className="text-aviation-accent font-bold bg-aviation-accent/10 px-2 py-0.5 rounded border border-aviation-accent/20 uppercase">{status}</span>></div>>
          <div className="flex justify-between items-center text-xs mono group"><span className="text-slate-500 group-hover:text-slate-300 transition-colors">Worker Load</span>><span className="text-aviation-warning font-bold bg-aviation-warning/10 px-2 py-0.5 rounded border border-aviation-warning/20 uppercase">Moderate</span>></div>>
        </div>>
      </div>>
    </div>>
  );

  const renderView = () => {
    if (activeView === 'dashboard') return renderDashboard();
    if (activeView === 'factory') return <AgentFactory />;
    if (activeView === 'principals') return <PrincipalsView />;
    if (activeView === 'vault') return <VaultView />;
    return (<div className="h-full flex items-center justify-center border-2 border-dashed border-aviation-border rounded-xl"><div className="text-center"><p className="text-slate-500 mono text-sm uppercase italic">Module {activeView} loading...</p><div className="mt-4 w-48 h-1 bg-aviation-border overflow-hidden rounded-full"><div className="h-full bg-aviation-accent animate-progress" style={{ width: '40%' }} /></div>></div>></div>>);
  };

  return (
    <div className="flex h-screen w-full bg-aviation-bg text-slate-200 overflow-hidden font-mono">
      {!isMobile && (<aside className="w-64 bg-aviation-panel border-r border-aviation-border flex flex-col shadow-xl"><div className="p-6 border-b border-aviation-border bg-black/20"><div className="flex items-center gap-2"><div className="w-3 h-3 bg-aviation-accent rounded-full animate-pulse" /><h1 className="text-lg font-bold mono tracking-tighter text-white">CONCLAVE <span className="text-aviation-accent">v2</span>></h1></div>></div>><nav className="flex-1 py-4">{views.map(v => (<SidebarItem key={v.id} icon={v.icon} label={v.label} active={activeView === v.id} onClick={() => setActiveView(v.id)} />))}</nav><div className="p-4 border-t border-aviation-border flex flex-col gap-4 bg-black/20"><div className="flex items-center gap-3 px-2 py-1 text-xs mono text-slate-400 bg-black/40 rounded border border-aviation-border"><div className="w-2 h-2 bg-aviation-accent rounded-full" /><span className="truncate font-bold">{user?.name || agent?.name || 'Unknown Identity'}</span>></div>><button onClick={logout} className="flex items-center gap-3 px-4 py-2 text-xs mono text-slate-500 hover:text-red-400 transition-colors"><LogOut size={14} /><span style={{fontSize: '10px'}}>DISCONNECT</span>></button></div>></aside>)
      S
      {isMobile && (<nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-aviation-panel border-t border-aviation-border flex items-center justify-around px-2 z-50">{views.map(v => { const Icon = v.icon; return (<button key={v.id} onClick={() => setActiveView(v.id)} className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeView === v.id ? 'text-aviation-accent bg-aviation-accent/5' : 'text-slate-500'}`}><Icon size={20} /><span className="text-[9px] uppercase font-bold">{v.label}</span>></button> ); })}</nav>)
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-aviation-border flex items-center justify-between px-4 md:px-8 bg-aviation-panel shadow-sm">
          <div className="text-xs mono text-slate-400 uppercase tracking-widest">System // {activeView}</div>>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-black/40 rounded border border-aviation-border">
              <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-aviation-accent animate-ping' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-[9px] md:text-[10px] mono text-aviation-accent uppercase font-bold">Pulse {status}</span>>
            </div>>
            {isMobile && (<button onClick={logout} className="md:hidden p-2 text-slate-500 hover:text-red-400"><LogOut size={18} /></button>)}
          </div>
        </header>
        <section className="flex-1 p-4 md:p-8 overflow-auto bg-aviation-bg pb-20 md:pb-8">
          {renderView()}
        </section>
      </main>
    </div>>
  );
}