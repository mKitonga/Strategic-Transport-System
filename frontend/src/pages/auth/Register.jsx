import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, storeSession } from '../../services/transportApi';

const ROLE_FIELDS = {
  sacco_admin: [
    { name: 'sacco_name', label: 'SACCO Name', type: 'text' },
    { name: 'route_name', label: 'Route Name', type: 'text' },
    { name: 'location', label: 'Location/Station', type: 'text' },
  ],
  sacco_driver: [
    { name: 'sacco_name', label: 'SACCO Name', type: 'text' },
    { name: 'number_plate', label: 'Number Plate', type: 'text', placeholder: 'e.g. KCA 123A' },
    { name: 'matatu_name', label: 'Matatu Name', type: 'text' },
  ],
  school_admin: [
    { name: 'school_name', label: 'School Name', type: 'text' },
    { name: 'location', label: 'Location', type: 'text' },
  ],
  school_driver: [
    { name: 'school_name', label: 'School Name', type: 'text' },
    { name: 'location', label: 'Location', type: 'text' },
  ],
  parent: [
    { name: 'student_name', label: 'Student Name', type: 'text' },
    { name: 'grade', label: 'Grade', type: 'text' },
    { name: 'school_name', label: 'School Name', type: 'text' },
    { name: 'location', label: 'Location', type: 'text' },
    { name: 'admission_number', label: 'Admission Number', type: 'text' },
  ],
  booking_admin: [
    { name: 'company_name', label: 'Booking Company Name', type: 'text' },
    { name: 'location', label: 'Location', type: 'text' },
  ],
  booking_driver: [
    { name: 'company_name', label: 'Booking Company Name', type: 'text' },
    { name: 'number_plate', label: 'Number Plate', type: 'text' },
    { name: 'bus_capacity', label: 'Bus Capacity', type: 'number' },
  ],
  passenger: [],
};

const ROLE_LABELS = {
  sacco_admin: 'SACCO Admin',
  sacco_driver: 'SACCO Driver',
  school_admin: 'School Admin',
  school_driver: 'School Driver',
  parent: 'Parent',
  booking_admin: 'Booking Admin',
  booking_driver: 'Booking Driver',
  passenger: 'Passenger',
};

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: '',
    profile_data: {},
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedFields = useMemo(() => ROLE_FIELDS[formData.role] || [], [formData.role]);

  const handleBaseChange = (e) => {
    const { name, value } = e.target;

    if (name === 'role') {
      setFormData((prev) => ({
        ...prev,
        role: value,
        profile_data: {},
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      profile_data: {
        ...prev.profile_data,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await registerUser(formData);
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
    <div className="auth-page">
      <div className="auth-page-header">
        <h2>Create Account</h2>
        <p>Complete the shared details first, then fill the role section that appears below.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-page-form">
        <div className="auth-grid auth-grid-two">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input required name="name" type="text" className="form-input" placeholder="John Doe" onChange={handleBaseChange} value={formData.name} />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input required name="phone" type="text" className="form-input" placeholder="+2547... or 07..." pattern="^(\+254[17]\d{8}|0[17]\d{8})$" onChange={handleBaseChange} value={formData.phone} />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input required name="email" type="email" className="form-input" placeholder="john@example.com" onChange={handleBaseChange} value={formData.email} />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select required name="role" className="form-select" onChange={handleBaseChange} value={formData.role}>
              <option value="" disabled>Select your role...</option>
              <optgroup label="SACCO Portal">
                <option value="sacco_admin">SACCO Admin</option>
                <option value="sacco_driver">SACCO Driver</option>
              </optgroup>
              <optgroup label="School Portal">
                <option value="school_admin">School Admin</option>
                <option value="school_driver">School Driver</option>
                <option value="parent">Parent</option>
              </optgroup>
              <optgroup label="Booking Platform">
                <option value="booking_admin">Booking Admin</option>
                <option value="booking_driver">Booking Driver</option>
                <option value="passenger">Passenger</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div className="auth-grid auth-grid-two">
          <div className="form-group">
            <label className="form-label">Password</label>
            <input required name="password" type="password" className="form-input" placeholder="********" onChange={handleBaseChange} value={formData.password} />
            <div className="password-checker" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
              <div style={{ color: formData.password.length >= 8 ? '#4ade80' : '#94a3b8' }}>● Min 8 characters</div>
              <div style={{ color: /[a-zA-Z]/.test(formData.password) ? '#4ade80' : '#94a3b8' }}>● Contains a letter</div>
              <div style={{ color: /[0-9]/.test(formData.password) ? '#4ade80' : '#94a3b8' }}>● Contains a number</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input required name="password_confirmation" type="password" className="form-input" placeholder="********" onChange={handleBaseChange} value={formData.password_confirmation} />
            {formData.password && formData.password_confirmation && formData.password !== formData.password_confirmation && (
              <div style={{ color: 'var(--color-accent)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Passwords do not match</div>
            )}
          </div>
        </div>

        <div className="role-panel">
          <div className="role-panel-header">
            <div>
              <p className="stage-eyebrow">Role Details</p>
              <h3>{formData.role ? ROLE_LABELS[formData.role] : 'Choose a role to continue'}</h3>
            </div>
            <div className="role-chip-list">
              {selectedFields.length > 0 ? selectedFields.map((field) => (
                <span className="role-chip" key={field.name}>{field.label}</span>
              )) : <span className="role-chip passive">No extra fields required</span>}
            </div>
          </div>

          {selectedFields.length > 0 ? (
            <div className="auth-grid auth-grid-two">
              {selectedFields.map((field) => (
                <div className="form-group" key={field.name}>
                  <label className="form-label">{field.label}</label>
                  <input
                    required
                    name={field.name}
                    type={field.type}
                    className="form-input"
                    placeholder={field.placeholder || ''}
                    onChange={handleProfileChange}
                    value={formData.profile_data[field.name] || ''}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="role-panel-note">
              Passenger registration does not require additional dropdown details. After registration, the passenger will be sent to the booking homepage.
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Registering...' : 'Register Now'}
        </button>
      </form>

      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <p className="auth-switch-text">
        Already have an account? <Link to="/auth/login">Login</Link>
      </p>
    </div>
  );
}
