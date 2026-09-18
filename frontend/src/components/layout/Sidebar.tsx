import { LayoutDashboard, Users, Kanban, FileText, Receipt as ReceiptIcon, UsersRound, MessageSquare } from 'lucide-react';
import type { View } from '@/types';

export const Sidebar = ({ 
  currentView, 
  setView, 
  isOpen, 
  setIsOpen 
}: { 
  currentView: View; 
  setView: (view: View) => void; 
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const navItems: { view: View; label: string; icon: React.ElementType }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'clients', label: 'Clients', icon: Users },
    { view: 'leads', label: 'Leads', icon: Kanban },
    { view: 'invoices', label: 'Invoices', icon: FileText },
    { view: 'receipts', label: 'Receipts', icon: ReceiptIcon },
    { view: 'team', label: 'Team', icon: UsersRound },
    { view: 'board', label: 'Board', icon: MessageSquare },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-[260px] bg-[var(--bg-secondary)] border-r border-[var(--border-color)]
        flex flex-col z-50 transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F2C94C] to-[#D4A93A] flex items-center justify-center">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <span className="text-xl font-semibold text-[var(--text-main)]">Zentrio</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => {
                  setView(item.view);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-[#F2C94C]/15 text-[#D4A93A] dark:text-[#F2C94C]' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)]'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F2C94C]/30 to-[#D4A93A]/30 flex items-center justify-center">
              <span className="text-[#D4A93A] dark:text-[#F2C94C] text-xs font-bold">KM</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-main)] truncate">Kwesi Mensah</p>
              <p className="text-xs text-[var(--text-muted)]">Admin</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};