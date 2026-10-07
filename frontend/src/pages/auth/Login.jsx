import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, storeSession } from '../../services/transportApi';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await loginUser(formData);
      storeSession(response.token, response.user);
      window.localStorage.setItem('devMockRole', response.user.role);
      navigate(response.redirect_path || response.user.dashboard_path || '/dashboard', {
        replace: true,
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page auth-page-login">
      <div className="auth-page-header">
        <h2>Sign In</h2>
        <p>Use the same email and password you created during registration to enter your role dashboard.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-page-form">
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input required name="email" type="email" className="form-input" placeholder="john@example.com" onChange={handleChange} value={formData.email} />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input required name="password" type="password" className="form-input" placeholder="********" onChange={handleChange} value={formData.password} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', marginTop: '-0.5rem' }}>
          <Link to="/auth/forgot-password" style={{ color: 'var(--color-brand)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>
            Forgot Password?
          </Link>
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <p className="auth-switch-text">
        Don&apos;t have an account? <Link to="/auth/register">Register</Link>
      </p>
    </div>
  );
}
