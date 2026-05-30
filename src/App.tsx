import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Activity, ShieldAlert, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';
import { usePulse } from './hooks/usePulse';
import AgentFactory from './components/factory/AgentFactory';
import PrincipalsView from './components/principals/PrincipalsView';
import VaultView from './components/vault/VaultView';
import LoginView from './components/auth/LoginView';
import TaskFeed from './components/feed/TaskFeed';
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
    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 rounded-lg group ${active ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
  >
    <Icon size={18} className={`${active ? 'text-[#39FF14]' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`} />
    <span className={`text-sm font-medium tracking-tight ${active ? 'font-semibold' : ''}`}>{label}</span>
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
      <div className="h-screen w-full bg-[#0a0d14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] mono text-slate-500 uppercase tracking-[0.3em] font-bold">Establishing Connection...</span>
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
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 p-8 bg-[#111520] border border-[#2a385a] rounded-3xl relative overflow-hidden group shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <h2 className="text-sm mono text-slate-500 mb-6 uppercase tracking-[0.2em] font-bold">Organization Overview</h2>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">{org?.name || org?.id || 'TheOrg'}</div>
            <div className="hidden md:block h-16 w-px bg-[#2a385a]" />
            <div className="text-xs mono text-slate-500 uppercase tracking-widest leading-relaxed opacity-60 font-medium">
              Secure Node<br />Active Cluster
            </div>
          </div>
        </div>
        <div className="p-8 bg-[#111520] border border-[#2a385a] rounded-3xl shadow-xl">
          <h2 className="text-sm mono text-slate-500 mb-6 uppercase tracking-[0.2em] font-bold">System Health</h2>
          <div className="space-y-5">
            {[
              { label: 'API Latency', value: '14ms', color: 'text-[#39FF14]' },
              { label: 'Pulse Stream', value: status, color: status === 'connected' ? 'text-[#39FF14]' : 'text-red-400' },
              { label: 'Worker Load', value: 'Moderate', color: 'text-amber-400' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center group cursor-default">
                <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{item.label}</span>
                <span className={`${item.color} text-xs font-bold px-3 py-1 rounded-full border border-current/20 bg-current/5 mono`}>
                  {item.value}
                </span>
              </div>
            ))}
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
    if (activeView === 'feed') return <TaskFeed />;
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 border border-dashed border-[#2a385a] rounded-3xl bg-black/20">
        <div className="w-48 h-1 bg-[#2a385a] overflow-hidden rounded-full">
          <div className="h-full bg-[#39FF14] animate-progress" style={{ width: '40%' }} />
        </div>
        <p className="text-slate-500 mono text-xs uppercase italic tracking-widest">Module {activeView} loading...</p>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0d14] text-slate-200 overflow-hidden">
      {!isMobile && (
        <aside className="w-64 bg-[#111520] border-r border-[#2a385a] flex flex-col shadow-2xl z-10">
          <div className="p-6 border-b border-[#2a385a] bg-black/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#39FF14] rounded-lg flex items-center justify-center text-black font-black text-xs shadow-[0_0_10px_rgba(57,255,20,0.4)]">C</div>
              <span className="font-bold text-lg tracking-tight text-white">Conclave</span>
            </div>
          </div>
          <nav className="flex-1 py-6 px-3 space-y-1">
            {views.map(v => (<SidebarItem key={v.id} icon={v.icon} label={v.label} active={activeView === v.id} onClick={() => setActiveView(v.id)} />))}
          </nav>
          <div className="p-4 border-t border-[#2a385a] flex flex-col gap-4 bg-black/30">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3 group hover:bg-white/10 transition-colors cursor-default">
              <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse" />
              <span className="truncate text-xs mono font-bold text-slate-300 group-hover:text-white transition-colors">{user?.name || agent?.name || 'Unknown Identity'}</span>
            </div>
            <button onClick={logout} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:text-white transition-all duration-200 group">
              <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
              <span className="uppercase tracking-widest text-[10px] font-bold">Logout</span>
            </button>
          </div>
        </aside>
      )}
      {isMobile && (
        <MobileNav currentView={activeView} setView={setActiveView} />
      )}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-[#2a385a] flex items-center justify-between px-8 bg-[#111520]/80 backdrop-blur-md z-10">
          <div className="text-xs mono text-slate-500 uppercase tracking-[0.3em] font-bold">System // {activeView}</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-black/60 rounded-full border border-[#2a385a]">
              <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-[#39FF14] animate-ping' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-[10px] mono text-[#39FF14] uppercase font-bold tracking-tighter">Pulse {status}</span>
            </div>
            {isMobile && (
              <button onClick={logout} className="md:hidden p-2 text-slate-500 hover:text-white transition-colors">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </header>
        <section className="flex-1 p-8 overflow-auto bg-[#0a0d14] pb-20 md:pb-8">
          {renderView()}
        </section>
      </main>
    </div>
  );
}
