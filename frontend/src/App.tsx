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

export default AuthPage;