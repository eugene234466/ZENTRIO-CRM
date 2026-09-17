import { LayoutDashboard, Users, FileText, UsersRound, MessageSquare } from 'lucide-react';
import type { View } from '@/types';

export const BottomNav = ({ 
  currentView, 
  setView 
}: { 
  currentView: View; 
  setView: (view: View) => void;
}) => {
  const navItems: { view: View; label: string; icon: React.ElementType }[] = [
    { view: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { view: 'clients', label: 'Clients', icon: Users },
    { view: 'invoices', label: 'Invoices', icon: FileText },
    { view: 'team', label: 'Team', icon: UsersRound },
    { view: 'board', label: 'Board', icon: MessageSquare },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] safe-area-bottom z-40">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                isActive 
                  ? 'text-[#D4A93A] dark:text-[#F2C94C]' 
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};