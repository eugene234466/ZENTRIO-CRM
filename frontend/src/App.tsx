import { useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/statusBadge';
import './App.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Topbar } from '@/components/layout/Topbar';
import { DashboardSection } from '@/pages/DashboardSection';
import { ClientsSection } from '@/pages/ClientsSection';
import { LeadsSection } from '@/pages/LeadsSection';
import { InvoicesSection } from '@/pages/InvoiceSection';
import { ReceiptsSection } from '@/pages/ReceiptsSection';
import { TeamSection } from '@/pages/TeamSection';
import { MessageBoardSection } from '@/pages/MessageBoardSection';
import { ProfileSection } from '@/pages/ProfileSection';
import { AuthPage } from '@/pages/AuthPage';





gsap.registerPlugin(ScrollTrigger);



// Main App Component
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { state, setView, addClient, updateClient, deleteClient, addLead, updateLead, deleteLead, moveLead, addInvoice, updateInvoice, deleteInvoice, addReceipt, addTeamMember, deleteTeamMember, addTask, addMessage, pinMessage, unpinMessage } = useAppState();
  const { toasts, addToast, removeToast } = useToast();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F2C94C] to-[#D4A93A] flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-2xl">Z</span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">Loading workspace…</p>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="grain-overlay" />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <AuthPage addToast={addToast} />
      </div>
    );
  }

  const renderContent = () => {
    switch (state.currentView) {
      case 'dashboard':
        return <DashboardSection state={state} />;
      case 'clients':
        return <ClientsSection state={state} addClient={addClient} updateClient={updateClient} deleteClient={deleteClient} addToast={addToast} />;
      case 'leads':
        return <LeadsSection state={state} addLead={addLead} updateLead={updateLead} deleteLead={deleteLead} moveLead={moveLead} addClient={addClient} addToast={addToast} />;
      case 'invoices':
        return <InvoicesSection state={state} addInvoice={addInvoice} updateInvoice={updateInvoice} deleteInvoice={deleteInvoice} addToast={addToast} />;
      case 'receipts':
        return <ReceiptsSection state={state} addReceipt={addReceipt} addToast={addToast} />;
      case 'team':
        return <TeamSection state={state} addTeamMember={addTeamMember} deleteTeamMember={deleteTeamMember} addTask={addTask} addToast={addToast} isAdmin={user.role === 'admin' || user.role === 'owner'} />;
      case 'board':
        return <MessageBoardSection state={state} addMessage={addMessage} pinMessage={pinMessage} unpinMessage={unpinMessage} addToast={addToast} currentUser={user} />;
      case 'profile':
        return <ProfileSection addToast={addToast} />;
      default:
        return <DashboardSection state={state} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Grain Overlay */}
      <div className="grain-overlay" />
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Sidebar */}
      <Sidebar 
        currentView={state.currentView} 
        setView={setView} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
      />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={user} onGoProfile={() => setView('profile')} />
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav currentView={state.currentView} setView={setView} />
    </div>
  );
}

export default App;
