import React, { useState } from 'react';
import { getStoredSession } from '../../../services/transportApi';
import { getRoleDashboard } from './roleDashboardData';

export const Profile = () => {
  const { user } = getStoredSession();
  const [profilePic, setProfilePic] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setProfilePic(URL.createObjectURL(file));
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      <h1 className="page-title">My Profile</h1>
      <p className="page-subtitle">Manage your personal details across the transport network.</p>

      <div className="card-grid">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{
            width: '150px', height: '150px', borderRadius: '50%',
            margin: '0 auto 1.5rem', background: 'var(--color-bg-glass)',
            border: '2px solid var(--color-brand)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {profilePic ? (
              <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'var(--color-text-muted)' }}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            )}
          </div>
          <label className="btn" style={{ background: 'var(--color-bg-glass)', cursor: 'pointer', display: 'block' }}>
            Upload Photo
            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3>Personal Details</h3>
          <form style={{ marginTop: '1.5rem' }} onSubmit={(e) => { e.preventDefault(); }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" defaultValue={user?.name || ''} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" defaultValue={user?.phone || ''} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" defaultValue={user?.email || ''} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input type="text" className="form-input" defaultValue={user?.role_label || ''} readOnly />
            </div>
            <button className="btn btn-primary" type="submit">Save Changes</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export const Statistics = () => {
  const { user } = getStoredSession();
  const roleMeta = getRoleDashboard(user?.role);

  return (
    <div>
      <h1 className="page-title">Role Statistics</h1>
      <p className="page-subtitle">Focused statistics for {roleMeta.portalName}.</p>

      <div className="role-stats-grid" style={{ marginTop: '1.25rem' }}>
        {roleMeta.stats.map((stat) => (
          <article key={stat.label} className={`role-stat-card ${stat.tone || ''}`}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>
    </div>
  );
};
