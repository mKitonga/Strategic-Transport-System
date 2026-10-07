import React from 'react';
import { getStoredSession } from '../../services/transportApi';
import { getRoleDashboard } from './shared/roleDashboardData';

export default function DashboardHome() {
  const { user } = getStoredSession();
  const roleMeta = getRoleDashboard(user?.role);

  return (
    <div className="role-dashboard-home">
      <section className="role-stats-grid">
        {roleMeta.stats.map((stat) => (
          <article key={stat.label} className={`role-stat-card ${stat.tone || ''}`}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="role-middle-grid">
        <article className="card role-overview-card">
          <p className="stage-eyebrow">Role Overview</p>
          <h3>{roleMeta.portalName}</h3>
          <p className="page-subtitle">{roleMeta.summary}</p>
          <div className="role-highlight-list">
            {roleMeta.highlights.map((highlight) => (
              <div key={highlight} className="role-highlight-item">
                <span className="role-highlight-dot"></span>
                <p>{highlight}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card role-activity-card">
          <p className="stage-eyebrow">Current Statistics</p>
          <h3>Today&apos;s Snapshot</h3>
          <div className="role-mini-stats">
            {roleMeta.stats.slice(0, 3).map((stat) => (
              <div key={stat.label} className="role-mini-stat">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
