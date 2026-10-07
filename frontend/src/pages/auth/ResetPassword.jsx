import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../services/transportApi';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setStatus({ type: 'error', message: 'Invalid or missing password reset token. Please request a new link.' });
    }
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !email) return;

    if (formData.password !== formData.password_confirmation) {
      setStatus({ type: 'error', message: 'The passwords you entered do not match.' });
      return;
    }

    if (formData.password.length < 8 || !/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setStatus({ type: 'error', message: 'Your password must be at least 8 characters long and include both letters and numbers.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await resetPassword({
        email,
        token,
        password: formData.password,
        password_confirmation: formData.password_confirmation
      });
      setStatus({ type: 'success', message: response.message || 'Password reset successful! Redirecting to login...' });
      setTimeout(() => {
        navigate('/auth/login');
      }, 2500);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to reset password. The link may have expired.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        <h2>New Password</h2>
        <p>Set a strong, memorable password to secure your transport account.</p>
      </header>

      {status.message && (
        <div className={`auth-feedback auth-feedback-${status.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          {status.message}
        </div>
      )}

      <form className="auth-page-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="password" className="form-label">Create New Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="form-input"
            placeholder="Min 8 chars, letter & number"
            value={formData.password}
            onChange={handleChange}
            required
            autoFocus
          />
          <div className="password-checker" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
            <div style={{ color: formData.password.length >= 8 ? '#4ade80' : '#94a3b8' }}>● Min 8 characters</div>
            <div style={{ color: /[a-zA-Z]/.test(formData.password) ? '#4ade80' : '#94a3b8' }}>● Contains a letter</div>
            <div style={{ color: /[0-9]/.test(formData.password) ? '#4ade80' : '#94a3b8' }}>● Contains a number</div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password_confirmation" className="form-label">Confirm New Password</label>
          <input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            className="form-input"
            placeholder="Repeat your new password"
            value={formData.password_confirmation}
            onChange={handleChange}
            required
          />
          {formData.password && formData.password_confirmation && formData.password !== formData.password_confirmation && (
            <div style={{ color: 'var(--color-accent)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Passwords do not match</div>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading || !token || !email}>
          {loading ? 'Securing Account...' : 'Update Password'}
        </button>
      </form>

      <footer className="auth-switch-text" style={{ marginTop: '1.5rem' }}>
        <p>Decided not to reset? <Link to="/auth/login" className="auth-link" style={{ fontWeight: 700 }}>Return to Login</Link></p>
      </footer>
    </div>
  );
}
