import { useState, useEffect } from 'react';
import { MdOutlineLightMode, MdOutlineDarkMode } from 'react-icons/md';
import { useTheme } from '@/hooks/useTheme.tsx';
import LoginForm from './LoginForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import AcceptInviteForm from './AcceptInviteForm';
import './auth.css';

type View = 'login' | 'forgot' | 'invite';
type AuthUser = Record<string, unknown>;

interface AuthWrapperProps {
  onAuthenticated: (user: AuthUser) => void;
}

const AuthWrapper = ({ onAuthenticated }: AuthWrapperProps) => {
  const [view, setView] = useState<View>('login');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Invite links look like /login?invite=<token>
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (token) {
      setInviteToken(token);
      setView('invite');
    }
  }, []);

  return (
    <div className={`auth-container ${theme}`}>
      <button className="theme-toggle-btn" onClick={toggleTheme} type="button">
        {theme === 'dark' ? (
          <>
            <MdOutlineLightMode /> Light Mode
          </>
        ) : (
          <>
            <MdOutlineDarkMode /> Dark Mode
          </>
        )}
      </button>

      <div className="auth-header">
        <div className="auth-title">
          {view === 'login' && 'Sign In'}
          {view === 'forgot' && 'Reset Password'}
          {view === 'invite' && 'Accept Invitation'}
        </div>
        <div className="auth-subtitle">
          {view === 'login' && 'Welcome back to Zentrio CRM'}
          {view === 'forgot' && 'Enter your email to receive a password reset link'}
          {view === 'invite' && 'Set up your password to join your team'}
        </div>
        <div className="auth-underline"></div>
      </div>

      {view === 'login' && (
        <LoginForm onForgotPassword={() => setView('forgot')} onAuthenticated={onAuthenticated} />
      )}
      {view === 'forgot' && <ForgotPasswordForm onBackToLogin={() => setView('login')} />}
      {view === 'invite' && inviteToken && (
        <AcceptInviteForm token={inviteToken} onAuthenticated={onAuthenticated} />
      )}
    </div>
  );
};

export default AuthWrapper;
