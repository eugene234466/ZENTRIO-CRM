import React, { useState } from 'react';
import { RiLockPasswordFill } from 'react-icons/ri';
import { authApi, type AuthUser } from './authApi';

interface AcceptInviteFormProps {
  token: string;
  onAuthenticated: (user: AuthUser) => void;
}

const AcceptInviteForm = ({ token, onAuthenticated }: AcceptInviteFormProps) => {
  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleInviteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (passwords.password !== passwords.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await authApi.acceptInvite(token, passwords.password);
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This invite link is invalid or has expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleInviteSubmit}>
      <div className="auth-inputs">
        <div className="auth-input-group">
          <RiLockPasswordFill />
          <input
            type="password"
            name="password"
            placeholder="Set New Password"
            value={passwords.password}
            onChange={handleInputChange}
            required
            minLength={8}
          />
        </div>

        <div className="auth-input-group">
          <RiLockPasswordFill />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm New Password"
            value={passwords.confirmPassword}
            onChange={handleInputChange}
            required
            minLength={8}
          />
        </div>
      </div>

      {error && <p className="auth-error">{error}</p>}

      <div className="auth-submit-container">
        <button type="submit" className="action-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Activating...' : 'Activate Account & Sign In'}
        </button>
      </div>
    </form>
  );
};

export default AcceptInviteForm;
