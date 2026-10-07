import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../services/transportApi';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await requestPasswordReset({ email });
      setStatus({ type: 'success', message: response.message || 'If an account exists, a reset link has been sent.' });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card auth-card-central">
      <header className="auth-page-header">
        <div className="auth-brand" style={{ justifyContent: 'center' }}>
          <span className="rail-brand-mark">STS</span>
          <div>
            <strong>Strategic Transport</strong>
            <small>Security Gateway</small>
          </div>
        </div>
        <h2>Reset Password</h2>
        <p>Enter your registered email address to receive a secure recovery link.</p>
      </header>

      {status.message && (
        <div className={`auth-feedback auth-feedback-${status.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          {status.message}
        </div>
      )}

      <form className="auth-page-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email Address</label>
          <input
            id="email"
            type="email"
            className="form-input"
            placeholder="e.g. moses@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading || !email}>
          {loading ? 'Processing...' : 'Send Recovery Link'}
        </button>
      </form>

      <footer className="auth-switch-text" style={{ marginTop: '1.5rem' }}>
        <p>Remembered your password? <Link to="/auth/login" className="auth-link" style={{ fontWeight: 700 }}>Log in here</Link></p>
      </footer>
    </div>
  );
}
