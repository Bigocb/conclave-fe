import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Activity, ShieldAlert, UserCircle, LogOut, MessageSquareText } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';
import { usePulse } from './hooks/usePulse';
import AgentFactory from './components/factory/AgentFactory';
import PrincipalsView from './components/principals/PrincipalsView';
import VaultView from './components/vault/VaultView';
import LoginView from './components/auth/LoginView';
import FeedView from './components/feed/FeedView';
import OpinionFeed from './components/feed/OpinionFeed';
import FleetView from './components/fleet/FleetView';
import ProfilesView from './components/profiles/ProfilesView';
import PulseView from './components/pulse/PulseView';
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
    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 rounded-lg group ${active ? 'bg-noc-green/10 text-noc-green' : 'text-noc-text2 hover:bg-white/5 hover:text-noc-text1'}`}
  >
    <Icon size={18} className={`${active ? 'text-noc-green' : 'text-noc-text2 group-hover:text-noc-text1'} transition-colors`} />
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
      <div className="h-screen w-full bg-noc-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-noc-green border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] mono text-noc-text3 uppercase tracking-[0.3em] font-bold">Establishing Connection...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const views = [
    { id: 'dashboard', label: 'Fleet Overview', icon: LayoutDashboard },
    { id: 'pulse', label: 'Live Pulse', icon: Activity },
    { id: 'fleet', label: 'Fleet Control', icon: Users },
    { id: 'agents', label: 'All Agents', icon: Users },
    { id: 'profiles', label: 'Profiles', icon: UserCircle },
    { id: 'principals', label: 'Principals', icon: UserCircle },
    { id: 'feed', label: 'Feed', icon: ShieldAlert },
    { id: 'opinions', label: 'Opinions', icon: MessageSquareText },
    { id: 'vault', label: 'Trust Vault', icon: ShieldAlert },
  ];

  const renderDashboard = () => (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 p-8 bg-noc-bg2 border border-noc-border rounded-3xl relative overflow-hidden group shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-noc-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <h2 className="text-sm mono text-noc-text3 mb-6 uppercase tracking-[0.2em] font-bold">Organization Overview</h2>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="text-5xl md:text-7xl font-black text-noc-text1 tracking-tighter leading-none">{org?.name || org?.id || 'TheOrg'}</div>
            <div className="hidden md:block h-16 w-px bg-noc-border" />
            <div className="text-xs mono text-noc-text3 uppercase tracking-widest leading-relaxed opacity-60 font-medium">
              Secure Node<br />Active Cluster
            </div>
          </div>
        </div>
        <div className="p-8 bg-noc-bg2 border border-noc-border rounded-3xl shadow-xl">
          <h2 className="text-sm mono text-noc-text3 mb-6 uppercase tracking-[0.2em] font-bold">System Health</h2>
          <div className="space-y-5">
            {[
              { label: 'API Latency', value: '14ms', color: 'text-noc-green' },
              { label: 'Pulse Stream', value: status, color: status === 'connected' ? 'text-noc-green' : 'text-noc-rose' },
              { label: 'Worker Load', value: 'Moderate', color: 'text-noc-amber' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center group cursor-default">
                <span className="text-sm text-noc-text2 group-hover:text-noc-text1 transition-colors">{item.label}</span>
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
    if (activeView === 'pulse') return <PulseView />;
    if (activeView === 'fleet') return <FleetView />;
    if (activeView === 'agents') return <AgentFactory />;
    if (activeView === 'factory') return <AgentFactory />;
    if (activeView === 'profiles') return <ProfilesView />;
    if (activeView === 'principals') return <PrincipalsView />;
    if (activeView === 'vault') return <VaultView />;
    if (activeView === 'feed') return <FeedView />;
    if (activeView === 'opinions') return <OpinionFeed />;
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 border border-dashed border-noc-border rounded-3xl bg-black/20">
        <div className="w-48 h-1 bg-noc-border overflow-hidden rounded-full">
          <div className="h-full bg-noc-green animate-progress" style={{ width: '40%' }} />
        </div>
        <p className="text-noc-text2 mono text-xs uppercase italic tracking-widest">Module {activeView} loading...</p>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-noc-bg text-noc-text1 overflow-hidden">
      {!isMobile && (
        <aside className="w-64 glass border-r border-noc-border flex flex-col shadow-2xl z-10">
          <div className="p-6 border-b border-noc-border bg-black/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-noc-green rounded-lg flex items-center justify-center text-black font-black text-xs noc-glow">C</div>
              <span className="font-bold text-lg tracking-tight text-noc-text1">Conclave</span>
            </div>
          </div>
          <nav className="flex-1 py-6 px-3 space-y-1">
            {views.map(v => (<SidebarItem key={v.id} icon={v.icon} label={v.label} active={activeView === v.id} onClick={() => setActiveView(v.id)} />))}
          </nav>
          <div className="p-4 border-t border-noc-border flex flex-col gap-4 bg-black/30">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3 group hover:bg-white/10 transition-colors cursor-default">
              <div className="w-2 h-2 bg-noc-green rounded-full animate-pulse" />
              <span className="truncate text-xs mono font-bold text-noc-text2 group-hover:text-noc-text1 transition-colors">{user?.name || agent?.name || 'Unknown Identity'}</span>
            </div>
            <button onClick={logout} className="flex items-center gap-3 px-4 py-2 text-sm text-noc-text2 hover:text-noc-text1 transition-all duration-200 group">
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
        <header className="h-16 border-b border-noc-border flex items-center justify-between px-8 bg-noc-bg2/80 backdrop-blur-md z-10">
          <div className="text-xs mono text-noc-text3 uppercase tracking-[0.3em] font-bold">System // {activeView}</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-black/60 rounded-full border border-noc-border">
              <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-noc-green animate-ping' : 'bg-noc-rose'}`} />
              <span className="text-[10px] mono text-noc-green uppercase font-bold tracking-tighter">Pulse {status}</span>
            </div>
            {isMobile && (
              <button onClick={logout} className="md:hidden p-2 text-noc-text2 hover:text-noc-text1 transition-colors">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </header>
        <section className="flex-1 p-8 overflow-auto bg-noc-bg pb-20 md:pb-8">
          {renderView()}
        </section>
      </main>
    </div>
  );
}