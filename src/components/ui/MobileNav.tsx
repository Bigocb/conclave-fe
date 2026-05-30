import { Home, Users, ClipboardList, Terminal, ShieldAlert } from 'lucide-react';

interface MobileNavProps {
  currentView: string;
  setView: (view: string) => void;
}

export function MobileNav({ currentView, setView }: MobileNavProps) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'fleet', label: 'Fleet', icon: Users },
    { id: 'feed', label: 'Tasks', icon: ClipboardList },
    { id: 'factory', label: 'Agents', icon: Terminal },
    { id: 'vault', label: 'Vault', icon: ShieldAlert },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-noc-bg/95 backdrop-blur-glass border-t border-noc-border z-50 px-4 pb-safe">
      <nav className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map(item => (
          <button 
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
              currentView === item.id ? 'text-noc-green scale-110' : 'text-noc-text3'
            }`}
          >
            <item.icon size={20} />
            <span className="text-[9px] uppercase tracking-widest font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
