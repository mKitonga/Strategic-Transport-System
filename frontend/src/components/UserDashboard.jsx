export default function UserDashboard({ user, onLogout }) {
  const profileEntries = Object.entries(user.profile_data ?? {})

  return (
    <section className="panel dashboard-panel">
      <div className="dashboard-top">
        <div className="panel-heading">
          <p className="eyebrow">Authenticated User</p>
          <h2>{user.role_label} dashboard</h2>
        </div>
        <button className="ghost-button" onClick={onLogout} type="button">
          Logout
        </button>
      </div>

      <div className="stats-grid dashboard-stats">
        <article className="stat-card">
          <span className="label">Name</span>
          <strong>{user.name}</strong>
          <p>{user.email}</p>
        </article>
        <article className="stat-card">
          <span className="label">Phone</span>
          <strong>{user.phone}</strong>
          <p>Role: {user.role_label}</p>
        </article>
        <article className="stat-card">
          <span className="label">Approval status</span>
          <strong className={user.status === 'active' ? 'status success' : 'status pending'}>
            {user.status.replaceAll('_', ' ')}
          </strong>
          <p>This reflects the auth flow from the current registration step.</p>
        </article>
      </div>

      <article className="panel inset-panel">
        <div className="panel-heading">
          <p className="eyebrow">Submitted Details</p>
          <h2>Role-specific registration information captured for this user</h2>
        </div>
        {profileEntries.length > 0 ? (
          <div className="profile-grid">
            {profileEntries.map(([key, value]) => (
              <div className="profile-item" key={key}>
                <span>{key.replaceAll('_', ' ')}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p>No additional registration fields were required for this role.</p>
        )}
      </article>
    </section>
  )
}
