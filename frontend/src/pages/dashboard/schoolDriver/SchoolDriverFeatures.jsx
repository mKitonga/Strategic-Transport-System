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

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetchSchoolDriverAlerts();
      setAlerts(res.alerts || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { loadAlerts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sendSchoolDriverAlert(form);
      setSuccess("Alert sent to School Admin successfully.");
      setForm({ subject: '', message: '' });
      await loadAlerts();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="role-middle-grid">
      <article className="card">
        <h1 className="page-title">Send Alert</h1>
        <p className="page-subtitle">Notify the school administration of any transit issues, delays, or emergencies.</p>

        {error && <p className="auth-feedback auth-feedback-error">{error}</p>}
        {success && <p className="auth-feedback table-success-text">{success}</p>}

        <form onSubmit={handleSubmit} className="auth-page-form" style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input className="form-input" required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="e.g. Delayed by traffic" />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="form-input" rows="4" required value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Details..." />
          </div>
          <button type="submit" className="btn btn-primary">Send Alert</button>
        </form>
      </article>

      <article className="card">
        <h3>Previous Alerts</h3>
        <div className="stack-list" style={{ marginTop: '1rem' }}>
          {!loading && alerts.length === 0 && <p className="page-subtitle">No alerts sent yet.</p>}
          {alerts.map(alert => (
            <div key={alert.id} className="stack-item" style={{ borderLeft: alert.status === 'open' ? '4px solid var(--color-brand)' : 'none' }}>
              <strong>{alert.subject}</strong>
              <p style={{ fontSize: '0.85rem' }}>{alert.message}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <span>{new Date(alert.created_at).toLocaleString()}</span>
                <span>{alert.status}</span>
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
};
