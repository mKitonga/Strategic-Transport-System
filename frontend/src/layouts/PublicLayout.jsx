import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const navLinks = [
  { name: 'Control Deck', path: '/' },
  { name: 'Traffic Updates', path: '/traffic-updates' },
  { name: 'SACCO Network', path: '/saccos' },
  { name: 'School Routes', path: '/schools' },
  { name: 'Help Centre', path: '/help' },
  { name: 'Booking Services', path: '/booking' },
  { name: 'Submit Complaint', path: '/complaints' },
];

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="transport-shell">
      <aside className="transport-rail">
        <Link to="/" className="rail-brand">
          <span className="rail-brand-mark">STS</span>
          <div>
            <strong>Strategic Transport</strong>
            <small>Urban mobility desk</small>
          </div>
        </Link>

        <div className="rail-section">
          <p className="rail-heading">Public Dashboard</p>
          <nav className="rail-nav">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={location.pathname === link.path ? 'rail-link active' : 'rail-link'}
              >
                <span className="rail-link-dot" />
                <span>{link.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="rail-section rail-panel">
          <p className="rail-heading">Access</p>
          <p className="rail-copy">
            Registration and login are available from the landing page, but they
            are intentionally kept outside the public dashboard menu.
          </p>
          <div className="rail-actions">
            <Link to="/auth/login" className="nav-btn nav-btn-outline">
              Login
            </Link>
            <Link to="/auth/register" className="nav-btn nav-btn-primary">
              Register
            </Link>
          </div>
        </div>
      </aside>

      <div className="transport-stage">
        <header className="stage-topbar">
          <div>
            <p className="stage-eyebrow">Transit Operations</p>
            <h1 className="stage-title">Public mobility, route discovery, and booking access</h1>
          </div>
          <div className="stage-status">
            <span className="status-pill live">Live network</span>
            <span className="status-pill amber">Kenya routes</span>
          </div>
        </header>

        <main className="stage-content">
          <Outlet />
        </main>

        <footer className="stage-footer">
          <span>Strategic Transport System</span>
          <div className="footer-links">
            <Link to="/terms">Terms & Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
