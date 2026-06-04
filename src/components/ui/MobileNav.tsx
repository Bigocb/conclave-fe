import { useState } from 'react';
import { Home, Users, Cpu, ShieldAlert, ClipboardList, Activity, UserCircle, MessageSquareText, Brain, MoreHorizontal, X } from 'lucide-react';

interface MobileNavProps {
  currentView: string;
  setView: (view: string) => void;
}

const primaryItems = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'memory', label: 'Memory', icon: Brain },
  { id: 'fleet', label: 'Fleet', icon: Cpu },
  { id: 'feed', label: 'Tasks', icon: ClipboardList },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];

const drawerItems = [
  { id: 'pulse', label: 'Live Pulse', icon: Activity },
  { id: 'agents', label: 'All Agents', icon: Users },
  { id: 'principals', label: 'Principals', icon: UserCircle },
  { id: 'profiles', label: 'Profiles', icon: UserCircle },
  { id: 'opinions', label: 'Opinions', icon: MessageSquareText },
  { id: 'vault', label: 'Trust Vault', icon: ShieldAlert },
];

export function MobileNav({ currentView, setView }: MobileNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleView = (view: string) => {
    setView(view);
    setDrawerOpen(false);
  };

  const isPrimary = (id: string) => primaryItems.some(p => p.id === id);

  return (
    <>
      {/* Bottom Nav Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-noc-bg/95 backdrop-blur-glass border-t border-noc-border z-50 px-4 pb-safe">
        <nav className="flex justify-around items-center h-16 max-w-md mx-auto">
          {primaryItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'more') {
                  setDrawerOpen(true);
                } else {
                  setView(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                item.id === 'more'
                  ? drawerOpen ? 'text-noc-green scale-110' : 'text-noc-text3'
                  : currentView === item.id ? 'text-noc-green scale-110' : 'text-noc-text3'
              }`}
            >
              {item.id === 'more' ? (
                <MoreHorizontal size={20} />
              ) : (
                <item.icon size={20} />
              )}
              <span className="text-[9px] uppercase tracking-widest font-bold">
                {item.id === 'more' && currentView !== 'dashboard' && !isPrimary(currentView) ? 'Now' : item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative bg-noc-bg2 border-t border-noc-border rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1 bg-noc-text3/40 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-noc-border">
              <h3 className="text-xs mono font-bold text-noc-text2 uppercase tracking-widest">All Views</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 text-noc-text3 hover:text-noc-text1 transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="p-4 pb-8 space-y-1">
              {/* Primary items (no longer in primary bar when drawer is open) */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {primaryItems.filter(i => i.id !== 'more').map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleView(item.id)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all ${
                      currentView === item.id
                        ? 'bg-noc-green/10 text-noc-green border border-noc-green/30'
                        : 'text-noc-text3 hover:bg-white/5 hover:text-noc-text2 border border-transparent'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="text-[8px] uppercase tracking-wider font-bold">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Secondary items */}
              {drawerItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      currentView === item.id
                        ? 'bg-noc-green/10 text-noc-green'
                        : 'text-noc-text3 hover:bg-white/5 hover:text-noc-text2'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                    {currentView === item.id && (
                      <span className="ml-auto text-[8px] px-2 py-0.5 rounded-full bg-noc-green/20 text-noc-green mono font-bold">ACTIVE</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}