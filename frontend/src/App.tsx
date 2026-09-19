import { useState, useEffect, useRef } from 'react';

import {
  LayoutDashboard, Users, Kanban, FileText, Receipt as ReceiptIcon, UsersRound,
  MessageSquare, Plus, Search, Bell, Menu, X, Sun, Moon,
  Calendar, TrendingUp, Clock, CheckCircle, Eye, Download, Share2,
  AlertCircle, DollarSign, Filter, Edit, Trash2,
  Send, Pin, CheckCircle2, Circle,
  Clock3, Building2, GraduationCap, Heart, Briefcase, ChevronLeft
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAppState } from '@/hooks/useAppState';
import { useToast } from '@/hooks/useToast';
import './App.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

const ToastContainer = ({
  toasts,
  removeToast,
}: {
  toasts: ReturnType<typeof useToast>['toasts'];
  removeToast: (id: string) => void;
}) => {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px] max-w-[90vw] animate-slide-in pointer-events-auto ${toast.type === 'success' ? 'bg-[#7DD3A6] text-white' :
            toast.type === 'error' ? 'bg-[#E57A7A] text-white' :
              'bg-[#F2C94C] text-[#1a1a2e]'
            }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'info' && <Bell className="w-5 h-5 flex-shrink-0" />}
          <span className="flex-1 text-sm font-medium">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

async function authRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data;
}

const AuthPage = ({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
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
        await authRequest('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ username, email, password }),
        });
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
        const user = await authRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        });
        onAuthenticated(user);
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

const CrmApp = ({ user, onLogout }: { user: AuthUser; onLogout: () => void }) => {
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
            isAdmin={isAdmin}
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
            state={state}
            addMessage={addMessage}
            pinMessage={pinMessage}
            unpinMessage={unpinMessage}
            addToast={addToast}
            currentUser={user}
          />
        );

      case 'profile':
        return (
          <ProfileSection
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
        user={user}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    authRequest('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsCheckingSession(false));
  }, []);

  const handleLogout = async () => {
    await authRequest('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
  };

  if (isCheckingSession) {
    return <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-muted)]">Checking session...</div>;
  }

  return user ? <CrmApp user={user} onLogout={handleLogout} /> : <AuthPage onAuthenticated={setUser} />;
}

export default App;