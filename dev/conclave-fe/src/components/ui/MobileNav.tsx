import { Home, Users, ClipboardList, Terminal, ShieldAlert } from 'lucide-react';

interface MobileNavProps {
  currentView: string;
  setView: (view: string) => void;
}

export function MobileNav({ currentView, setView }: MobileNavProps) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'principals', label: 'Fleet', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'command-center', label: 'Pulse', icon: Terminal },
    { id: 'vault', label: 'Vault', icon: ShieldAlert },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-aviation-border backdrop-blur-md z-50 px-4 pb-safe">
      <nav className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map(item => (
          <button 
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
              currentView === item.id ? 'text-aviation-accent scale-110' : 'text-slate-500'
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
