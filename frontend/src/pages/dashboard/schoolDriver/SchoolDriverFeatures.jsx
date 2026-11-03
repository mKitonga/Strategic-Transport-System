import React, { useEffect, useState } from 'react';
import {
  fetchSchoolDriverTrips,
  fetchSchoolDriverAlerts,
  sendSchoolDriverAlert
} from '../../../services/schoolDriverApi';
import TrafficMap from '../shared/TrafficMap';

export const DriverTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const res = await fetchSchoolDriverTrips();
        setTrips(res.trips || []);
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    loadTrips();
  }, []);

  return (
    <div>
      <h1 className="page-title">My Assigned Trips</h1>
      <p className="page-subtitle">View your daily compiled list of students and their assigned pickup times.</p>

      <div className="card" style={{ marginBottom: '2rem', height: '400px', padding: '0.5rem' }}>
         <TrafficMap />
      </div>

      {error && <p className="auth-feedback auth-feedback-error">{error}</p>}

      <div className="card-grid">
        {!loading && trips.length === 0 && (
          <div className="card">
            <p className="page-subtitle">You have no assigned trips yet.</p>
          </div>
        )}

        {trips.map(trip => (
          <div key={trip.trip_id} className="card">
            <h3>{trip.route_name} ({trip.grade})</h3>
            <p className="page-subtitle">Base Time: {trip.pickup_time} - {trip.dropoff_time}</p>

            <div className="stack-list" style={{ marginTop: '1rem' }}>
              <h4 style={{ color: 'var(--color-brand)' }}>Assigned Pickup Time: {trip.assigned_pickup_time}</h4>
              {trip.students.map((s, i) => (
                <div key={i} className="stack-item">
                  <strong>{s.student_name}</strong>
                  <p style={{ fontSize: '0.85rem' }}>Parent: {s.parent_name} | {s.parent_phone}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Location: {s.home_location}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DriverAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetchSchoolDriverAlerts();
      setAlerts(res.alerts || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { loadAlerts(); }, []);

  const filteredAlerts = alerts.filter((alert) => `${alert.subject || ''} ${alert.message || ''} ${alert.status || ''}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filteredAlerts.length / pageSize));
  const visibleAlerts = filteredAlerts.slice(page * pageSize, (page + 1) * pageSize);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await sendSchoolDriverAlert(form);
      setSuccess("Alert sent to School Admin successfully.");
      setForm({ subject: '', message: '' });
      setModalOpen(false);
      await loadAlerts();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <h1 className="page-title">Admin Alerts</h1>
      <p className="page-subtitle">Notify the school administration of transit issues, delays, or emergencies and review alerts you have sent.</p>
      {error && !modalOpen ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
      {success ? <p className="auth-feedback table-success-text">{success}</p> : null}

      <section className="card route-directory-panel">
        <div className="route-directory-toolbar">
          <button className="btn btn-outline route-register-button" onClick={() => { setError(''); setSuccess(''); setModalOpen(true); }}>Send alert</button>
          <span className="route-count">{filteredAlerts.length} {filteredAlerts.length === 1 ? 'alert' : 'alerts'}</span>
          <div className="route-search-row"><input className="form-input" aria-label="Search alerts" placeholder="Search subject, message or status" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /><span className="route-search-icon" aria-hidden="true">&#128269;</span></div>
          <div className="route-pagination" aria-label="Alert pages"><button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>&lsaquo;</button><span>{page + 1} / {pageCount}</span><button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>&rsaquo;</button></div>
        </div>
        <div className="data-table-wrap"><table className="data-table route-directory-table">
          <thead><tr><th>#</th><th>Subject</th><th>Message</th><th>Sent</th><th>Status</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="5" className="empty-table-cell">Loading alerts...</td></tr>}
            {!loading && visibleAlerts.length === 0 && <tr><td colSpan="5" className="empty-table-cell">{alerts.length ? 'No alerts match your search.' : 'No alerts sent yet.'}</td></tr>}
            {!loading && visibleAlerts.map((alert, index) => <tr key={alert.id}><td>{page * pageSize + index + 1}</td><td><strong>{alert.subject}</strong></td><td style={{ minWidth: '280px', whiteSpace: 'normal' }}>{alert.message}</td><td>{alert.created_at ? new Date(alert.created_at).toLocaleString() : '—'}</td><td><span className={`role-chip ${alert.status === 'open' ? 'passive' : ''}`}>{alert.status}</span></td></tr>)}
          </tbody>
        </table></div>
      </section>

      {modalOpen ? <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="school-driver-alert-title">
        <div className="dashboard-modal-heading"><div><h2 id="school-driver-alert-title">Send alert to school admin</h2><p className="page-subtitle">Describe the transit issue, delay, or emergency.</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setModalOpen(false)}>×</button></div>
        {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
        <form onSubmit={handleSubmit} className="auth-page-form"><div className="form-group"><label className="form-label">Subject</label><input className="form-input" required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="e.g. Delayed by traffic" /></div><div className="form-group"><label className="form-label">Message</label><textarea className="form-input" rows="4" required value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Details..." /></div><div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary">Send alert</button></div></form>
      </section></div> : null}
    </div>
  );
};
