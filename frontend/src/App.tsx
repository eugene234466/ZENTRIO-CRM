import { useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppState } from '@/hooks/useAppState';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { ToastContainer } from '@/components/statusBadge';
import type { AuthUser } from '@/components/Login-register/authApi';
import type { SearchResult } from '@/lib/api';
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
import { ProfileSection } from '@/pages/ProfileSection';

gsap.registerPlugin(ScrollTrigger);

const AuthPage = () => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetFeedback = () => {
    setError('');
    setMessage('');
  };

  const switchMode = (next: 'login' | 'register' | 'forgot') => {
    setMode(next);
    resetFeedback();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        await signup(username, email, password);
        setMode('login');
        setPassword('');
        setMessage('Account created. Sign in to continue.');
      } else if (mode === 'forgot') {
        await authRequest('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: forgotEmail }),
        });
        setMessage('If that email is registered, a reset link has been sent.');
      } else {
        await login(username, password);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to complete the request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="grain-overlay" />
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-[#D4A93A] dark:text-[#F2C94C] text-sm font-semibold tracking-[0.2em]">ZENTRIO CRM</p>
          <h1 className="text-3xl font-bold text-[var(--text-main)] mt-3">
            {mode === 'login' && 'Welcome back'}
            {mode === 'register' && 'Create your account'}
            {mode === 'forgot' && 'Reset your password'}
          </h1>
          <p className="text-[var(--text-muted)] mt-2">
            {mode === 'login' && 'Sign in to access your workspace.'}
            {mode === 'register' && 'Register to start managing your workspace.'}
            {mode === 'forgot' && 'Enter your email and we\'ll send you a reset link.'}
          </p>
        </div>

        {mode === 'forgot' ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
                required
                className="mt-2"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="auth-username">Username</Label>
              <Input id="auth-username" value={username} onChange={(event) => setUsername(event.target.value)} required minLength={4} maxLength={20} className="mt-2" />
            </div>
            {mode === 'register' && (
              <div>
                <Label htmlFor="auth-email">Email</Label>
                <Input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-2" />
              </div>
            )}
            <div>
              <Label htmlFor="auth-password">Password</Label>
              <Input id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={20} className="mt-2" />
            </div>
          </div>
        )}

        {mode === 'login' && (
          <div className="text-right mt-2">
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="text-sm font-semibold text-[#D4A93A] dark:text-[#F2C94C] hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-[#E57A7A]">{error}</p>}
        {message && <p className="mt-4 text-sm text-[#7DD3A6]">{message}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full mt-6 bg-[#F2C94C] text-[#1a1a2e] hover:bg-[#D4A93A]">
          {isSubmitting
            ? 'Please wait...'
            : mode === 'login'
              ? 'Sign in'
              : mode === 'register'
                ? 'Create account'
                : 'Send reset link'}
        </Button>

        {mode === 'forgot' ? (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="w-full mt-4 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            ← Back to sign in
          </button>
        ) : (
          <button
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="w-full mt-4 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </button>
        )}
      </form>
    </main>
  );
};

const CrmApp = ({ user }: { user: AuthUser }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

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
    updateLead,
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

    // Settings
    updateSettings,
  } = useAppState();

  const {
    toasts,
    addToast,
    removeToast,
  } = useToast();

  const isAdmin = user.role === 'admin' || user.role === 'owner';

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
            searchTerm={clientSearch}
            onSearchChange={setClientSearch}
          />
        );

      case 'leads':
        return (
          <LeadsSection
            state={state}
            addLead={addLead}
            updateLead={updateLead}
            deleteLead={deleteLead}
            moveLead={moveLead}
            addClient={addClient}
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
            isAdmin={isAdmin}
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
            isAdmin={isAdmin}
          />
        );

      case 'board':
        return (
          <MessageBoardSection
            addToast={addToast}
            currentUser={user}
          />
        );

      case 'settings':
        return (
          <SettingsSection
            state={state}
            updateSettings={updateSettings}
          />
        );

      case 'profile':
        return (
          <ProfileSection
            addToast={addToast}
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
        user={user}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          onGoProfile={() => setView('profile')}
          onPickSearchResult={(result: SearchResult) => {
            if (result.type === 'client') setView('clients');
            else if (result.type === 'lead') setView('leads');
            else if (result.type === 'invoice') setView('invoices');
          }}
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
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-muted)]">Checking session...</div>;
  }

  return user ? <CrmApp user={user} /> : <AuthPage />;
}

export default App;