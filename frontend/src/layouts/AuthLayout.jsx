import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="auth-shell auth-shell-central">
      <section className="auth-center-stage">
        <div className="auth-center-copy">
          <p className="stage-eyebrow">Transport Access Desk</p>
          <h1>Enter the Strategic Transport System from one central access point.</h1>
          <p>
            Register or sign in as a SACCO admin, SACCO driver, school admin,
            school driver, parent, booking admin, booking driver, or passenger.
          </p>
          <div className="auth-route-strip">
            <span>SACCO</span>
            <span>School</span>
            <span>Booking</span>
            <span>Passenger</span>
          </div>
        </div>

        <section className="auth-form-shell">
          <div className="auth-card auth-card-central">
            <div className="auth-brand">
              <span className="rail-brand-mark">STS</span>
              <div>
                <strong>Strategic Transport</strong>
                <small>Registration and login hub</small>
              </div>
            </div>
            <Outlet />
            <Link to="/" className="auth-backlink">
              Return to landing page
            </Link>
          </div>
        </section>
      </section>
    </div>
  );
}
