import React, { useState } from 'react';
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';
import { authApi, type AuthUser } from './authApi';

interface LoginFormProps {
  onForgotPassword: () => void;
  onAuthenticated: (user: AuthUser) => void;
}

const LoginForm = ({ onForgotPassword, onAuthenticated }: LoginFormProps) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await authApi.login(formData.email, formData.password);
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLoginSubmit}>
      <div className="auth-inputs">
        <div className="auth-input-group">
          <MdEmail />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="auth-input-group">
          <RiLockPasswordFill />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="forgot-password-link">
        <span onClick={onForgotPassword}>Forgot password?</span>
      </div>

      {error && <p className="auth-error">{error}</p>}

      <div className="auth-submit-container">
        <button type="submit" className="action-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
