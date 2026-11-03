import React, { useEffect, useState } from 'react';
import { fetchDriverOverview, notifyDriverArrival } from '../../../services/bookingApi';
import { getStoredSession } from '../../../services/transportApi';

const getBookingDriverId = () => getStoredSession().user?.id;

export const AssignedBookingTrips = () => {
  const [overview, setOverview] = useState({ assigned_trips: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const pageSize = 10;
  const driverId = getBookingDriverId();

  useEffect(() => {
    const loadOverview = async () => {
      if (!driverId) {
        setError('Your booking driver account could not be identified. Please sign in again.');
        setLoading(false);
        return;
      }
      try {
        const data = await fetchDriverOverview(driverId);
        setOverview({ ...data, assigned_trips: data.assigned_trips || [] });
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, [driverId]);

  const trips = overview.assigned_trips || [];
  const filteredTrips = trips.filter((trip) => `${trip.route_name || ''} ${trip.company_name || ''} ${trip.time || ''} ${trip.departure || ''} ${trip.destination || ''} ${trip.major_departure_point || ''}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filteredTrips.length / pageSize));
  const visibleTrips = filteredTrips.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div>
      <h1 className="page-title">Assigned Booking Trips</h1>
      <p className="page-subtitle">Trips and passenger details assigned to your booking driver account.</p>
      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
      <section className="card route-directory-panel">
        <div className="route-directory-toolbar route-directory-toolbar-no-action">
          <span className="route-count">{filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}</span>
          <div className="route-search-row"><input className="form-input" aria-label="Search assigned trips" placeholder="Search route, company or departure" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /><span className="route-search-icon" aria-hidden="true">&#128269;</span></div>
          <div className="route-pagination" aria-label="Assigned trip pages"><button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>&lsaquo;</button><span>{page + 1} / {pageCount}</span><button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>&rsaquo;</button></div>
        </div>
        <div className="data-table-wrap"><table className="data-table route-directory-table">
          <thead><tr><th>#</th><th>Company / Route</th><th>Departure</th><th>Departure point</th><th>Fare (KES)</th><th>Passengers</th><th>Action</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="7" className="empty-table-cell">Loading assigned trips from the backend...</td></tr>}
            {!loading && visibleTrips.length === 0 && <tr><td colSpan="7" className="empty-table-cell">{trips.length ? 'No trips match your search.' : 'No trips are assigned to your booking driver account.'}</td></tr>}
            {!loading && visibleTrips.map((trip, index) => <tr key={trip.trip_id}><td>{page * pageSize + index + 1}</td><td><strong>{trip.route_name}</strong><br /><span className="page-subtitle">{trip.company_name} | {trip.departure} to {trip.destination}</span></td><td>{trip.time}</td><td>{trip.major_departure_point}</td><td>{trip.fare}</td><td>{(trip.passengers || []).length}</td><td><button className="btn btn-outline action-btn" onClick={() => setSelectedTrip(trip)}>View passengers</button></td></tr>)}
          </tbody>
        </table></div>
      </section>

      {selectedTrip ? <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedTrip(null); }}><section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="assigned-passengers-title">
        <div className="dashboard-modal-heading"><div><h2 id="assigned-passengers-title">Passengers</h2><p className="page-subtitle">{selectedTrip.route_name} | {selectedTrip.time}</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setSelectedTrip(null)}>×</button></div>
        <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Seat</th><th>Passenger</th><th>Phone</th><th>Status</th></tr></thead><tbody>
          {(selectedTrip.passengers || []).length === 0 ? <tr><td colSpan="4" className="empty-table-cell">No passengers assigned to this trip.</td></tr> : selectedTrip.passengers.map((passenger) => <tr key={passenger.id}><td>{passenger.seat}</td><td>{passenger.name}</td><td>{passenger.phone}</td><td>{passenger.status}</td></tr>)}
        </tbody></table></div>
      </section></div> : null}
    </div>
  );
};
export const DriverArrivalAlert = () => {
  const [overview, setOverview] = useState({ assigned_trips: [] });
  const [selectedTripId, setSelectedTripId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const driverId = getBookingDriverId();

  useEffect(() => {
    const loadOverview = async () => {
      if (!driverId) {
        setError('Your booking driver account could not be identified. Please sign in again.');
        setLoading(false);
        return;
      }
      try {
        const data = await fetchDriverOverview(driverId);
        const assignedTrips = data.assigned_trips || [];
        setOverview({ ...data, assigned_trips: assignedTrips });
        if (assignedTrips.length > 0) {
          setSelectedTripId(String(assignedTrips[0].trip_id));
        }
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, [driverId]);

  const handleNotify = async () => {
    try {
      setError('');
      setMessage('');
      const response = await notifyDriverArrival(selectedTripId, { driver_id: Number(driverId) });
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
        {loading ? <p className="page-subtitle">Loading assigned trips...</p> : null}
        {!loading && overview.assigned_trips.length === 0 ? <p className="page-subtitle">No assigned trips are available for arrival notification.</p> : null}
        <div className="form-group">
          <label className="form-label">Select assigned trip</label>
          <select
            className="form-select"
            onChange={(event) => setSelectedTripId(event.target.value)}
            value={selectedTripId}
            disabled={loading || overview.assigned_trips.length === 0}
          >
            {overview.assigned_trips.map((trip) => (
              <option key={trip.trip_id} value={trip.trip_id}>
                {trip.route_name} - {trip.time} ({trip.major_departure_point})
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" disabled={loading || !selectedTripId} onClick={handleNotify}>
          Notify Booking Admin of Arrival
        </button>
        {message ? <p style={{ marginTop: '1rem', color: 'var(--color-success)' }}>{message}</p> : null}
        {error ? <p style={{ marginTop: '1rem', color: 'var(--color-danger)' }}>{error}</p> : null}
      </div>
    </div>
  );
};
