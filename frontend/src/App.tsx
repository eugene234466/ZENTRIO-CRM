import { useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAppState } from '@/hooks/useAppState';
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
import { SettingsSection } from '@/pages/SettingsSection';

gsap.registerPlugin(ScrollTrigger);

// Main App Component
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    state,

    // Navigation
    setView,

    // Clients
    addClient,
    updateClient,
    deleteClient,

    // Leads
    addLead,
    deleteLead,
    moveLead,

    // Invoices
    addInvoice,
    updateInvoice,
    deleteInvoice,

    // Receipts
    addReceipt,

    // Team
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,

    // Tasks
    addTask,
    updateTask,
    deleteTask,

    // Message Board
    addMessage,
    pinMessage,
    unpinMessage,

    // Settings
    updateSettings,
  } = useAppState();

  const {
    toasts,
    addToast,
    removeToast,
  } = useToast();

  const renderContent = () => {
    switch (state.currentView) {
      case 'dashboard':
        return (
          <DashboardSection
            state={state}
          />
        );

      case 'clients':
        return (
          <ClientsSection
            state={state}
            addClient={addClient}
            updateClient={updateClient}
            deleteClient={deleteClient}
            addToast={addToast}
          />
        );

      case 'leads':
        return (
          <LeadsSection
            state={state}
            addLead={addLead}
            deleteLead={deleteLead}
            moveLead={moveLead}
            addToast={addToast}
          />
        );

      case 'invoices':
        return (
          <InvoicesSection
            state={state}
            addInvoice={addInvoice}
            updateInvoice={updateInvoice}
            deleteInvoice={deleteInvoice}
            addToast={addToast}
          />
        );

      case 'receipts':
        return (
          <ReceiptsSection
            state={state}
            addReceipt={addReceipt}
            addToast={addToast}
          />
        );

      case 'team':
        return (
          <TeamSection
            state={state}
            addTeamMember={addTeamMember}
            updateTeamMember={updateTeamMember}
            deleteTeamMember={deleteTeamMember}
            addTask={addTask}
            updateTask={updateTask}
            deleteTask={deleteTask}
            addToast={addToast}
          />
        );

      case 'board':
        return (
          <MessageBoardSection
            state={state}
            addMessage={addMessage}
            pinMessage={pinMessage}
            unpinMessage={unpinMessage}
            addToast={addToast}
          />
        );

      case 'settings':
        return (
          <SettingsSection
            state={state}
            updateSettings={updateSettings}
          />
        );

      default:
        return (
          <DashboardSection
            state={state}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {/* Toast Container */}
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
      />

      {/* Sidebar */}
      <Sidebar
        currentView={state.currentView}
        setView={setView}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        currentView={state.currentView}
        setView={setView}
      />
    </div>
  );
}

export default App;