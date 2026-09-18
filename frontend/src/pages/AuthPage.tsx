import { useState, type FormEvent } from 'react';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

type Mode = 'login' | 'register';

export const AuthPage = ({ addToast }: { addToast: (msg: string, type: 'success' | 'error' | 'info') => void }) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; email?: string; password?: string }>({});

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setFieldErrors({});
  };

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    const name = username.trim();
    const mail = email.trim();

    if (!name) {
      errors.username = 'Username is required.';
    } else if (name.length < 4 || name.length > 20) {
      errors.username = 'Username must be 4–20 characters.';
    }

    if (mode === 'register') {
      if (!mail) {
        errors.email = 'Email is required to create an account.';
      } else if (mail.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
        errors.email = 'Enter a valid email address.';
      }
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (password.length > 20) {
      errors.password = 'Password must be at most 20 characters.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0] ?? 'Invalid input.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(username, password);
        addToast(`Welcome back, ${username.trim()}`, 'success');
      } else {
        await signup(username, email, password);
        addToast('Account created. Please log in.', 'success');
        switchMode('login');
        setPassword('');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      addToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F2C94C] to-[#D4A93A] flex items-center justify-center">
            <span className="text-white font-bold text-2xl">Z</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">Zentrio</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {mode === 'login' ? 'Log in to your workspace' : 'Create your workspace account'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-[#F2C94C]/15 text-[#D4A93A] dark:text-[#F2C94C]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {m === 'login' ? 'Log in' : 'Register'}
            </button>
          ))}
        </div>

        <Card className="bg-[var(--card-bg)] border-[var(--border-color)] rounded-[28px]">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auth-username">Username</Label>
                <Input
                  id="auth-username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (fieldErrors.username) setFieldErrors((p) => ({ ...p, username: undefined }));
                  }}
                  placeholder="e.g. kwesi"
                  autoComplete="username"
                  minLength={4}
                  maxLength={20}
                  aria-invalid={!!fieldErrors.username}
                  className="bg-[var(--input-bg)]"
                />
                {fieldErrors.username && (
                  <p className="text-xs text-red-500">{fieldErrors.username}</p>
                )}
              </div>

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="auth-email">Email</Label>
                  <Input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                    }}
                    placeholder="you@company.com"
                    autoComplete="email"
                    maxLength={120}
                    aria-invalid={!!fieldErrors.email}
                    className="bg-[var(--input-bg)]"
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-500">{fieldErrors.email}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="auth-password">Password</Label>
                <Input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  placeholder={mode === 'register' ? 'Min. 8 characters' : 'Your password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={8}
                  maxLength={20}
                  aria-invalid={!!fieldErrors.password}
                  className="bg-[var(--input-bg)]"
                />
                {fieldErrors.password ? (
                  <p className="text-xs text-red-500">{fieldErrors.password}</p>
                ) : (
                  mode === 'register' && (
                    <p className="text-xs text-[var(--text-muted)]">Must be 8–20 characters.</p>
                  )
                )}
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A] disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : mode === 'login' ? (
                  <LogIn className="w-4 h-4 mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[var(--text-muted)]">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="text-[#D4A93A] dark:text-[#F2C94C] font-medium hover:underline"
          >
            {mode === 'login' ? 'Register' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};
