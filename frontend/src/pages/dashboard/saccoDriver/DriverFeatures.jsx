import React, { useEffect, useMemo, useState } from 'react';
import {
  clearDriverDropoff,
  createFarePrompt,
  fetchArrivalStatus,
  fetchDriverDropoffs,
  fetchDriverFares,
  fetchDriverSchoolTransport,
  notifyArrival,
} from '../../../services/saccoDriverApi';
import TrafficMap from '../shared/TrafficMap';

export const ArrivalAlert = () => {
  const [queueEntry, setQueueEntry] = useState(null);
  const [stationLocation, setStationLocation] = useState('');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const loadStatus = async () => {
    try {
      const response = await fetchArrivalStatus();
      setQueueEntry(response.queue_entry || null);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleNotify = async () => {
    setError('');
    try {
      await notifyArrival({ station_location: stationLocation });
      setStationLocation('');
      await loadStatus();
      setModalOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">Station Arrival</h1>
      <p className="page-subtitle">Notify the SACCO admin when you reach the SACCO location so you can be placed in the queue.</p>
      {error && !modalOpen ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <section className="card route-directory-panel">
        <div className="route-directory-toolbar route-directory-toolbar-no-action">
          <button className="btn btn-outline route-register-button" onClick={() => { setError(''); setModalOpen(true); }}>Notify arrival</button>
          <span className="route-count">{queueEntry ? '1 queue notification' : '0 queue notifications'}</span>
          <div className="route-search-row"><input className="form-input" aria-label="Search arrival status" placeholder="Search station or status" value={search} onChange={(event) => setSearch(event.target.value)} /><span className="route-search-icon" aria-hidden="true">&#128269;</span></div>
        </div>
        <div className="data-table-wrap">
          <table className="data-table route-directory-table">
            <thead><tr><th>#</th><th>Queue position</th><th>SACCO station</th><th>Status</th><th>Notification time</th></tr></thead>
            <tbody>
              {(!queueEntry || !`${queueEntry.station_location || ''} ${queueEntry.status || ''}`.toLowerCase().includes(search.toLowerCase())) ? <tr><td colSpan="5" className="empty-table-cell">{queueEntry ? 'No queue status matches your search.' : 'No arrival notification has been sent yet.'}</td></tr> : null}
              {queueEntry && `${queueEntry.station_location || ''} ${queueEntry.status || ''}`.toLowerCase().includes(search.toLowerCase()) ? <tr><td>1</td><td>#{queueEntry.queue_position}</td><td>{queueEntry.station_location}</td><td>{queueEntry.status}</td><td>{queueEntry.notified_at || queueEntry.created_at || '—'}</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen ? <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="arrival-modal-title">
          <div className="dashboard-modal-heading"><div><h2 id="arrival-modal-title">Send Arrival Notification</h2><p className="page-subtitle">Tell the SACCO admin which station you have reached.</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setModalOpen(false)}>×</button></div>
          {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
          <form className="auth-page-form" onSubmit={(event) => { event.preventDefault(); handleNotify(); }}>
            <div className="form-group"><label className="form-label">SACCO location</label><input className="form-input" value={stationLocation} onChange={(event) => setStationLocation(event.target.value)} placeholder="e.g. Odeon Terminus" required /></div>
            <div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" type="submit">Alert admin &amp; join queue</button></div>
          </form>
        </section>
      </div> : null}
    </div>
  );
};

export const DriverFares = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [boardingTerminalId, setBoardingTerminalId] = useState('');
  const [dropoffTerminalId, setDropoffTerminalId] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const loadFares = async () => {
    try {
      const response = await fetchDriverFares();
      setRoutes(response.routes || []);
      const firstRoute = response.routes?.[0];
      if (firstRoute && !selectedRouteId) {
        setSelectedRouteId(String(firstRoute.id));
        setBoardingTerminalId(String(firstRoute.terminals?.[0]?.id || ''));
        setDropoffTerminalId(String(firstRoute.terminals?.[1]?.id || firstRoute.terminals?.[0]?.id || ''));
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => { loadFares(); }, []);

  const selectedRoute = useMemo(() => routes.find((route) => String(route.id) === String(selectedRouteId)) || null, [routes, selectedRouteId]);
  const matchedFare = useMemo(() => {
    if (!selectedRoute) return null;
    return (selectedRoute.fares || []).find((fare) => String(fare.from_terminal_id) === String(boardingTerminalId) && String(fare.to_terminal_id) === String(dropoffTerminalId)) || null;
  }, [selectedRoute, boardingTerminalId, dropoffTerminalId]);

  useEffect(() => {
    if (selectedRoute) {
      setBoardingTerminalId(String(selectedRoute.terminals?.[0]?.id || ''));
      setDropoffTerminalId(String(selectedRoute.terminals?.[1]?.id || selectedRoute.terminals?.[0]?.id || ''));
    }
  }, [selectedRouteId]);

  const isPeakHour = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    return day >= 1 && day <= 5 && ((hour >= 6 && hour < 9) || (hour >= 17 && hour < 20));
  };
  const getEffectiveFare = (fare) => {
    if (!fare) return null;
    const peak = isPeakHour();
    if (peak && fare.peak_amount != null) return { amount: fare.peak_amount, period: 'peak' };
    if (!peak && fare.off_peak_amount != null) return { amount: fare.off_peak_amount, period: 'off-peak' };
    return { amount: fare.amount, period: 'standard' };
  };
  const effectiveFare = getEffectiveFare(matchedFare);
  const periodColor = { peak: '#ef4444', 'off-peak': '#22c55e', standard: 'var(--color-primary)' };
  const fareRows = routes.flatMap((route) => (route.fares || []).map((fare) => ({ ...fare, routeName: route.route_name, routeLocation: route.location })));
  const filteredFares = fareRows.filter((fare) => `${fare.routeName || ''} ${fare.routeLocation || ''} ${fare.from_terminal_name || ''} ${fare.to_terminal_name || ''} ${fare.amount}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filteredFares.length / pageSize));
  const visibleFares = filteredFares.slice(page * pageSize, (page + 1) * pageSize);

  const handlePrompt = async () => {
    setError('');
    setSuccess('');
    try {
      const response = await createFarePrompt({ sacco_route_id: Number(selectedRouteId), boarding_terminal_id: Number(boardingTerminalId), dropoff_terminal_id: Number(dropoffTerminalId), passenger_phone: passengerPhone });
      setSuccess(response.message || 'Prompt sent.');
      setPassengerPhone('');
      setModalOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">Fares &amp; Payments</h1>
      <p className="page-subtitle">Review your SACCO fares and send an M-Pesa prompt to a passenger.</p>
      {error && !modalOpen ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
      {success ? <p className="auth-feedback" style={{ color: 'var(--color-success)' }}>{success}</p> : null}
      <section className="card route-directory-panel">
        <div className="route-directory-toolbar">
          <button className="btn btn-outline route-register-button" onClick={() => { setError(''); setModalOpen(true); }} disabled={routes.length === 0}>Send M-Pesa prompt</button>
          <span className="route-count">{filteredFares.length} {filteredFares.length === 1 ? 'fare' : 'fares'}</span>
          <div className="route-search-row"><input className="form-input" aria-label="Search fares" placeholder="Search route or terminal" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /><span className="route-search-icon" aria-hidden="true">&#128269;</span></div>
          <div className="route-pagination" aria-label="Fare pages"><button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>&lsaquo;</button><span>{page + 1} / {pageCount}</span><button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>&rsaquo;</button></div>
        </div>
        <div className="data-table-wrap">
          <table className="data-table route-directory-table">
            <thead><tr><th>#</th><th>Route</th><th>Boarding terminal</th><th>Drop-off terminal</th><th>Standard (KES)</th><th>Peak (KES)</th><th>Off-peak (KES)</th></tr></thead>
            <tbody>
              {visibleFares.length === 0 ? <tr><td colSpan="7" className="empty-table-cell">{routes.length === 0 ? 'No routes or fares are available.' : (fareRows.length === 0 ? 'No fares configured yet.' : 'No fares match your search.')}</td></tr> : null}
              {visibleFares.map((fare, index) => <tr key={fare.id}><td>{page * pageSize + index + 1}</td><td><strong>{fare.routeName}</strong><br /><span className="page-subtitle">{fare.routeLocation}</span></td><td>{fare.from_terminal_name}</td><td>{fare.to_terminal_name}</td><td>{fare.amount}</td><td>{fare.peak_amount ?? 'N/A'}</td><td>{fare.off_peak_amount ?? 'N/A'}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
      {modalOpen ? <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="driver-fare-modal-title">
          <div className="dashboard-modal-heading"><div><h2 id="driver-fare-modal-title">Passenger Fare Prompt</h2><p className="page-subtitle">Choose the route details and passenger phone number.</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setModalOpen(false)}>×</button></div>
          {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
          <form className="auth-page-form" onSubmit={(event) => { event.preventDefault(); handlePrompt(); }}>
            <div className="form-group"><label className="form-label">Route</label><select className="form-select" value={selectedRouteId} onChange={(event) => setSelectedRouteId(event.target.value)} required>{routes.map((route) => <option key={route.id} value={route.id}>{route.route_name}</option>)}</select></div>
            <div className="auth-grid auth-grid-two">
              <div className="form-group"><label className="form-label">Boarding terminal</label><select className="form-select" value={boardingTerminalId} onChange={(event) => setBoardingTerminalId(event.target.value)} required>{(selectedRoute?.terminals || []).map((terminal) => <option key={terminal.id} value={terminal.id}>{terminal.terminal_name}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Drop-off terminal</label><select className="form-select" value={dropoffTerminalId} onChange={(event) => setDropoffTerminalId(event.target.value)} required>{(selectedRoute?.terminals || []).map((terminal) => <option key={terminal.id} value={terminal.id}>{terminal.terminal_name}</option>)}</select></div>
            </div>
            <div className="form-group"><label className="form-label">Passenger phone number</label><input className="form-input" type="tel" value={passengerPhone} onChange={(event) => setPassengerPhone(event.target.value)} placeholder="+2547... or 07..." required /></div>
            {effectiveFare ? <div className="role-stat-card" style={{ marginBottom: '1rem', borderLeft: `4px solid ${periodColor[effectiveFare.period]}` }}><span>Fare applied ({effectiveFare.period})</span><strong style={{ color: periodColor[effectiveFare.period] }}>KES {effectiveFare.amount}</strong></div> : <div className="role-stat-card amber" style={{ marginBottom: '1rem' }}><span>Fare amount</span><strong>No fare set for this route</strong></div>}
            <div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={!matchedFare || !passengerPhone}>Send M-Pesa prompt</button></div>
          </form>
        </section>
      </div> : null}
    </div>
  );
};
export const PassengerDropOffs = () => {
  const [dropoffs, setDropoffs] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const loadDropoffs = async () => {
    try {
      const response = await fetchDriverDropoffs();
      setDropoffs(response.dropoffs || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    loadDropoffs();
  }, []);

  const filteredDropoffs = dropoffs.filter((dropoff) => `${dropoff.passenger_phone || ''} ${dropoff.route_name || ''} ${dropoff.boarding_terminal || ''} ${dropoff.dropoff_terminal || ''} ${dropoff.prompt_status || ''}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filteredDropoffs.length / pageSize));
  const visibleDropoffs = filteredDropoffs.slice(page * pageSize, (page + 1) * pageSize);

  const handleClear = async (paymentId) => {
    try {
      await clearDriverDropoff(paymentId);
      await loadDropoffs();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">Passenger Drop-offs</h1>
      <p className="page-subtitle">Passengers who entered drop-off terminals appear here with their phone number so you can track where they alight.</p>
      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <div className="card route-directory-panel" style={{ padding: 0 }}>
        <div className="route-directory-toolbar route-directory-toolbar-no-action">
          <span className="route-count">{filteredDropoffs.length} {filteredDropoffs.length === 1 ? 'passenger' : 'passengers'}</span>
          <div className="route-search-row">
            <input className="form-input" aria-label="Search passenger drop-offs" placeholder="Search phone, route or terminal" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} />
            <span className="route-search-icon" aria-hidden="true">&#128269;</span>
          </div>
          <div className="route-pagination" aria-label="Drop-off pages">
            <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>‹</button>
            <span>{page + 1} / {pageCount}</span>
            <button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>›</button>
          </div>
        </div>
        <div className="data-table-wrap">
          <table className="data-table route-directory-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Passenger Phone</th>
                <th>Route</th>
                <th>Boarding Terminal</th>
                <th>Drop-off Terminal</th>
                <th>Fare</th>
                <th>Prompt Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleDropoffs.length === 0 ? <tr><td colSpan="8" className="empty-table-cell">{dropoffs.length === 0 ? 'No passenger drop-off records yet.' : 'No drop-offs match your search.'}</td></tr> : null}

              {visibleDropoffs.map((dropoff, index) => (
                <tr key={dropoff.id}>
                  <td>{page * pageSize + index + 1}</td>
                  <td>{dropoff.passenger_phone}</td>
                  <td>{dropoff.route_name}</td>
                  <td>{dropoff.boarding_terminal}</td>
                  <td>{dropoff.dropoff_terminal}</td>
                  <td>KES {dropoff.fare_amount}</td>
                  <td>{dropoff.prompt_status}</td>
                  <td>
                    <button className="btn btn-outline action-btn" onClick={() => handleClear(dropoff.id)}>
                      Clear Passenger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const StudentTransportDriver = () => {
  const [assignments, setAssignments] = useState([]);
  const [closingAssignments, setClosingAssignments] = useState([]);
  const [error, setError] = useState('');

  const loadAssignments = async () => {
    try {
      const response = await fetchDriverSchoolTransport();
      setAssignments(response.assignments || []);
      setClosingAssignments(response.closing_assignments || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  return (
    <div>
      <h1 className="page-title">Assigned Student Transport</h1>
      <p className="page-subtitle">View general vehicle requests and specific closing day trip assignments here.</p>
      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <div className="card" style={{ marginBottom: '2rem', height: '400px', padding: '0.5rem' }}>
         <TrafficMap />
      </div>

      <div className="role-middle-grid">
        <article className="card">
          <h3>General Vehicle Requests</h3>
          <div className="stack-list" style={{ marginTop: '1rem' }}>
            {assignments.length === 0 ? (
              <p className="page-subtitle">No general school assignment has been sent to this driver yet.</p>
            ) : null}

            {assignments.map((assignment) => (
              <div key={assignment.request_id} className="stack-item" style={{ borderLeft: '4px solid var(--color-brand)' }}>
                <div className="info-topline">
                  <h4>{assignment.school_name}</h4>
                </div>
                <p><strong>Location:</strong> {assignment.location}</p>
                <p><strong>Requested Vehicles:</strong> {assignment.requested_vehicles}</p>
                <p className="page-subtitle">{assignment.notes || 'No extra instructions were added.'}</p>

                <div className="stack-list" style={{ marginTop: '1rem' }}>
                  {assignment.students.length === 0 ? (
                    <p className="page-subtitle">No students linked to this school yet.</p>
                  ) : null}

                  {assignment.students.map((student, index) => (
                    <div key={`${assignment.request_id}-${index}`} className="stack-item" style={{ fontSize: '0.85rem' }}>
                      <strong>{student.student_name}</strong>
                      <p>Parent: {student.parent_name} | {student.parent_phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h3>Closing Day Trips</h3>
          <div className="stack-list" style={{ marginTop: '1rem' }}>
            {closingAssignments.length === 0 ? (
              <p className="page-subtitle">No closing day trips assigned to you yet.</p>
            ) : null}

            {closingAssignments.map((trip) => (
              <div key={trip.trip_id} className="stack-item" style={{ borderLeft: '4px solid var(--color-teal)' }}>
                <div className="info-topline">
                  <h4>{trip.school_name}</h4>
                </div>
                <p><strong>Location:</strong> {trip.location}</p>
                <p><strong>Closing Day:</strong> {trip.closing_day}</p>

                <div className="stack-list" style={{ marginTop: '1rem' }}>
                  <h5 style={{ color: 'var(--color-teal)' }}>Compiled Student List</h5>
                  {trip.students.map((student, index) => (
                    <div key={`${trip.trip_id}-${index}`} className="stack-item" style={{ fontSize: '0.85rem' }}>
                      <strong>{student.student_name} ({student.grade})</strong>
                      <p>Parent: {student.parent_name} | {student.parent_phone}</p>
                      <p style={{ color: 'var(--color-text-muted)' }}>Location: {student.home_location}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
};
