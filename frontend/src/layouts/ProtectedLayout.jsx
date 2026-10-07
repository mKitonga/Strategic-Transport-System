import React, { useMemo } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { clearStoredSession, getStoredSession } from '../services/transportApi';
import { getRoleDashboard } from '../pages/dashboard/shared/roleDashboardData';

export default function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = getStoredSession();
  const isAuthenticated = Boolean(token && user);
  const activeRole = user?.role || window.localStorage.getItem('devMockRole') || 'parent';
  const roleMeta = getRoleDashboard(activeRole);

  const linksToRender = useMemo(() => {
    const linkGroups = {
      sacco_admin: [
        { name: 'Approve Drivers', path: '/dashboard/admin/approve-drivers' },
        { name: 'Routes & Terminals', path: '/dashboard/admin/routes-terminals' },
        { name: 'Manage Fares', path: '/dashboard/admin/fares' },
        { name: 'Queue Management', path: '/dashboard/admin/queues' },
        { name: 'School Transport', path: '/dashboard/admin/schools' },
        { name: 'Complaints', path: '/dashboard/admin/complaints' },
        { name: 'Analytical Reports', path: '/dashboard/admin/reports' },
      ],
      sacco_driver: [
        { name: 'Fares & Payments', path: '/dashboard/driver/fares' },
        { name: 'Arrival Alert', path: '/dashboard/driver/arrival' },
        { name: 'Passenger Drop-offs', path: '/dashboard/driver/dropoffs' },
        { name: 'Student Transport', path: '/dashboard/driver/students' },
        { name: 'Analytical Reports', path: '/dashboard/driver/reports' },
      ],
      school_admin: [
        { name: 'Approve Drivers', path: '/dashboard/school-admin/approve' },
        { name: 'Driver Alerts', path: '/dashboard/school-admin/alerts' },
        { name: 'Student Trips', path: '/dashboard/school-admin/trips' },
        { name: 'Payments', path: '/dashboard/school-admin/payments' },
        { name: 'SACCO Comm.', path: '/dashboard/school-admin/sacco' },
        { name: 'Complaints', path: '/dashboard/school-admin/complaints' },
        { name: 'Analytical Reports', path: '/dashboard/school-admin/reports' },
      ],
      school_driver: [
        { name: 'Assigned Trips', path: '/dashboard/school-driver/trips' },
        { name: 'Admin Alerts', path: '/dashboard/school-driver/alerts' },
        { name: 'Analytical Reports', path: '/dashboard/school-driver/reports' },
      ],
      parent: [
        { name: 'Register Child', path: '/dashboard/parent/register' },
        { name: 'View Trips', path: '/dashboard/parent/trips' },
        { name: 'M-Pesa Payments', path: '/dashboard/parent/payments' },
        { name: 'Notifications', path: '/dashboard/parent/notifications' },
        { name: 'Analytical Reports', path: '/dashboard/parent/reports' },
      ],
      booking_admin: [
        { name: 'Approve Drivers', path: '/dashboard/booking-admin/drivers' },
        { name: 'Routes & Fares', path: '/dashboard/booking-admin/routes' },
        { name: 'Bus Availability', path: '/dashboard/booking-admin/buses' },
        { name: 'Passenger List', path: '/dashboard/booking-admin/passengers' },
        { name: 'Complaints', path: '/dashboard/booking-admin/complaints' },
        { name: 'Analytical Reports', path: '/dashboard/booking-admin/reports' },
      ],
      booking_driver: [
        { name: 'Assigned Trips', path: '/dashboard/booking-driver/trips' },
        { name: 'Arrival Alert', path: '/dashboard/booking-driver/arrival' },
        { name: 'Analytical Reports', path: '/dashboard/booking-driver/reports' },
      ],
      passenger: [
        { name: 'Book Ticket', path: '/dashboard/passenger/book' },
        { name: 'My Tickets', path: '/dashboard/passenger/tickets' },
        { name: 'Analytical Reports', path: '/dashboard/passenger/reports' },
      ],
    };

    return linkGroups[activeRole] || [];
  }, [activeRole]);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleSignOut = (event) => {
    event.preventDefault();
    clearStoredSession();
    window.localStorage.removeItem('devMockRole');
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-brand">
          <span className="rail-brand-mark">STS</span>
          <div>
            <strong>{roleMeta.portalName}</strong>
            <small>Role Functions</small>
          </div>
        </div>

        <div className="dashboard-sidebar-block">
          <p className="stage-eyebrow">Role Summary</p>
          <p className="dashboard-sidebar-copy">{roleMeta.summary}</p>
        </div>

        <nav className="dashboard-nav">
          <Link to="/dashboard" className={`dashboard-nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            Overview
          </Link>
          {linksToRender.map((link) => (
            <Link key={link.path} to={link.path} className={`dashboard-nav-item ${location.pathname === link.path ? 'active' : ''}`}>
              {link.name}
            </Link>
          ))}
          <Link to="/dashboard/statistics" className={`dashboard-nav-item ${location.pathname === '/dashboard/statistics' ? 'active' : ''}`}>
            Statistics
          </Link>
          <Link to="/dashboard/profile" className={`dashboard-nav-item ${location.pathname === '/dashboard/profile' ? 'active' : ''}`}>
            My Profile
          </Link>
          <Link to="/dashboard/help" className={`dashboard-nav-item ${location.pathname === '/dashboard/help' ? 'active' : ''}`}>
            Help Center
          </Link>
        </nav>

        <button type="button" className="dashboard-signout" onClick={handleSignOut}>
          Sign Out
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-main-header">
          <div>
            <p className="stage-eyebrow">Role Dashboard</p>
            <h1>{roleMeta.portalName}</h1>
            <p>{roleMeta.summary}</p>
          </div>
          <div className="dashboard-user-badge">
            <span>{user?.name || 'Transport User'}</span>
            <strong>{user?.role_label || roleMeta.portalName}</strong>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
