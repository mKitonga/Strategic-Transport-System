import React, { useEffect, useState } from 'react';
import { fetchDriverOverview, notifyDriverArrival } from '../../../services/bookingApi';

const DRIVER_ID = 501;

export const AssignedBookingTrips = () => {
  const [overview, setOverview] = useState({ assigned_trips: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const data = await fetchDriverOverview(DRIVER_ID);
        setOverview(data);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  if (loading) {
    return <p className="page-subtitle">Loading assigned booking trips...</p>;
  }

  if (error) {
    return <p className="page-subtitle" style={{ color: 'var(--color-danger)' }}>{error}</p>;
  }

  return (
    <div>
      <h1 className="page-title">Assigned Booking Trips</h1>
      <p className="page-subtitle">See the trips and passengers assigned to this booking driver.</p>

      <div className="card-grid">
        {overview.assigned_trips.map((trip) => (
          <div key={trip.trip_id} className="card" style={{ borderLeft: '4px solid var(--color-brand)' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>{trip.route_name}</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              {trip.company_name} | {trip.time} | {trip.departure} to {trip.destination}
            </p>
            <p><strong>Departure point:</strong> {trip.major_departure_point}</p>
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Passengers</h4>
              {trip.passengers.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-glass)' }}>
                      <th style={{ padding: '0.75rem' }}>Seat</th>
                      <th style={{ padding: '0.75rem' }}>Passenger</th>
                      <th style={{ padding: '0.75rem' }}>Phone</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trip.passengers.map((passenger) => (
                      <tr key={passenger.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem' }}>{passenger.seat}</td>
                        <td style={{ padding: '0.75rem' }}>{passenger.name}</td>
                        <td style={{ padding: '0.75rem' }}>{passenger.phone}</td>
                        <td style={{ padding: '0.75rem' }}>{passenger.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'var(--color-text-muted)' }}>No passengers assigned yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DriverArrivalAlert = () => {
  const [overview, setOverview] = useState({ assigned_trips: [] });
  const [selectedTripId, setSelectedTripId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const data = await fetchDriverOverview(DRIVER_ID);
        setOverview(data);
        if (data.assigned_trips.length > 0) {
          setSelectedTripId(String(data.assigned_trips[0].trip_id));
        }
      } catch (requestError) {
        setError(requestError.message);
      }
    };

    loadOverview();
  }, []);

  const handleNotify = async () => {
    try {
      setError('');
      setMessage('');
      const response = await notifyDriverArrival(selectedTripId, { driver_id: DRIVER_ID });
      setMessage(`${response.message} ${response.next_action}`);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">Arrival Notification</h1>
      <p className="page-subtitle">Notify the booking admin when you arrive at a major departure point.</p>

      <div className="card" style={{ maxWidth: '720px' }}>
        <div className="form-group">
          <label className="form-label">Select assigned trip</label>
          <select
            className="form-select"
            onChange={(event) => setSelectedTripId(event.target.value)}
            value={selectedTripId}
          >
            {overview.assigned_trips.map((trip) => (
              <option key={trip.trip_id} value={trip.trip_id}>
                {trip.route_name} - {trip.time} ({trip.major_departure_point})
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" disabled={!selectedTripId} onClick={handleNotify}>
          Notify Booking Admin of Arrival
        </button>
        {message ? <p style={{ marginTop: '1rem', color: 'var(--color-success)' }}>{message}</p> : null}
        {error ? <p style={{ marginTop: '1rem', color: 'var(--color-danger)' }}>{error}</p> : null}
      </div>
    </div>
  );
};
