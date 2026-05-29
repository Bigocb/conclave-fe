import React from 'react'
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  ShieldAlert, 
  UserCircle,
  LogOut
} from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { useAuthStore } from './store/authStore'
import { usePulse } from './hooks/usePulse'
import AgentFactory from './components/factory/AgentFactory'
import PrincipalsView from './components/principals/PrincipalsView'
import VaultView from './components/vault/VaultView'
import LoginView from './components/auth/LoginView'

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: SidebarItemProps) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 
    ${active 
      ? 'bg-aviation-accent/10 text-aviation-accent border-r-2 border-aviation-accent' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    <Icon size={20} />
    <span className="text-sm font-medium mono">{label}</span>
  </div>
)

export default function App() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { agent, org, user } = useAuthStore();
  const { status } = usePulse();
  const [activeView, setActiveView] = React.useState('dashboard')

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-aviation-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-aviation-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs mono text-slate-500 uppercase tracking-widest">Authenticating Agent...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen w-full bg-aviation-bg text-slate-200 overflow-hidden">
      <aside className="w-64 bg-aviation-panel border-r border-aviation-border flex flex-col">
        <div className="p-6 border-b border-aviation-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-aviation-accent rounded-full animate-pulse" />
            <h1 className="text-lg font-bold mono tracking-tighter text-white">CONCLAVE <span className="text-aviation-accent">v2</span></h1>
          </div>
        </div>
        
        <nav className="flex-1 py-4">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="DASHBOARD" 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')} 
          />
          <SidebarItem 
            icon={Users} 
            label="AGENT FACTORY" 
            active={activeView === 'factory'} 
            onClick={() => setActiveView('factory')} 
          />
          <SidebarItem 
            icon={UserCircle} 
            label="PRINCIPALS" 
            active={activeView === 'principals'} 
            onClick={() => setActiveView('principals')} 
          />
          <SidebarItem 
            icon={Activity} 
            label="PULSE FEED" 
            active={activeView === 'feed'} 
            onClick={() => setActiveView('feed')} 
          />
          <SidebarItem 
            icon={ShieldAlert} 
            label="VAULT" 
            active={activeView === 'vault'} 
            onClick={() => setActiveView('vault')} 
          />
        </nav>

        <div className="p-4 border-t border-aviation-border flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2 py-1 text-xs mono text-slate-400">
            <div className="w-2 h-2 bg-aviation-accent rounded-full" />
            <span className="truncate">{user?.name || agent?.name || 'Unknown Identity'}</span>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 text-xs mono text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} />
            <span style={{fontSize: '10px'}}>DISCONNECT</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-aviation-border flex items-center justify-between px-8 bg-aviation-panel">
          <div className="text-xs mono text-slate-400">
            SYSTEM // {activeView.toUpperCase()}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded border border-aviation-border">
              <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-aviation-accent animate-ping' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-[10px] mono text-aviation-accent uppercase">
                Pulse {status}
              </span
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-aviation-border overflow-hidden" />
          </div>
        </header>

        <section className="flex-1 p-8 overflow-auto">
          {activeView === 'dashboard' && (
            <div className="grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="col-span-2 h-64 bg-aviation-panel border border-aviation-border rounded-lg p-6 noc-glow">
                <h2 className="text-sm mono text-slate-400 mb-4 uppercase">Organization Overview</h2>
                <div className="flex items-end gap-4">
                  <div className="text-5xl font-bold mono text-white">{org?.name || 'Loading...'}</div>
                  <div className="text-xs mono text-slate-500 mb-2">Current Org Context</div>
                </div>
              </div>
              <div className="h-64 bg-aviation-panel border border-aviation-border rounded-lg p- la-6">
                <h2 className="text-sm mono text-slate-400 mb-4 uppercase">System Health</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs mono">
                    <span className="text-slate-500">API Latency</span>
                    <span className="text-aviation-accent">14ms</span>
                  </div>
                  <div className="flex justify-between text-xs mono">
                    <span className="text-slate-500">Pulse Stream</span>
                    <span className="text-aviation-accent">{status?.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-xs mono">
                    <span className="text-slate-500">Worker Load</span>
                    <span className="text-aviation-warning">MODERATE</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeView === 'factory' && <AgentFactory />}
          {activeView === 'principals' && <PrincipalsView />}
          {activeView === 'vault' && <VaultView />}

          {activeView !== 'dashboard' && activeView !== 'factory' && activeView !== 'principals' && activeView !== 'vault' && (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-aviation-border rounded-xl">
              <div className="text-center">
                <p className="text-slate-500 mono text-sm uppercase italic">Module {activeView} loading...</p>
                <div className="mt-4 w-48 h-1 bg-aviation-border overflow-hidden rounded-full">
                  <div className="h-full bg-aviation-accent animate-progress" style={{ width: '40%' }} />
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
