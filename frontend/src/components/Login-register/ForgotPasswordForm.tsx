import React, { useState } from 'react';
import { MdEmail } from 'react-icons/md';
import { authApi } from './authApi';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

const ForgotPasswordForm = ({ onBackToLogin }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      // A genuine failure (network/server down) — not "email not found",
      // since the backend intentionally never reveals that either way.
      setError(err instanceof Error ? err.message : 'Unable to send reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {submitted ? (
        <div className="auth-subtitle">
          <p>Password reset email sent to <strong>{email}</strong>.</p>
          <p style={{ marginTop: '15px' }}>Please check your inbox for instructions.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="auth-inputs">
            <div className="auth-input-group">
              <MdEmail />
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <div className="auth-submit-container">
            <button type="submit" className="action-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      )}

      <div className="auth-toggle-text">
        <span className="auth-toggle-link" onClick={onBackToLogin}>
          ← Back to Sign In
        </span>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
