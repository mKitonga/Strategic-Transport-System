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
    try {
      await notifyArrival({ station_location: stationLocation });
      setStationLocation('');
      await loadStatus();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">Station Arrival</h1>
      <p className="page-subtitle">Notify the SACCO admin when you reach the SACCO location so you can be placed in the queue.</p>
      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <div className="role-middle-grid">
        <div className="card">
          <h3>Send Arrival Notification</h3>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">SACCO Location</label>
            <input className="form-input" value={stationLocation} onChange={(event) => setStationLocation(event.target.value)} placeholder="e.g. Odeon Terminus" />
          </div>
          <button className="btn btn-primary" onClick={handleNotify}>Alert Admin & Join Queue</button>
        </div>

        <div className="card">
          <h3>Latest Queue Status</h3>
          {queueEntry ? (
            <div className="stack-list" style={{ marginTop: '1rem' }}>
              <div className="stack-item">
                <strong>Queue Position</strong>
                <p>#{queueEntry.queue_position}</p>
              </div>
              <div className="stack-item">
                <strong>Station</strong>
                <p>{queueEntry.station_location}</p>
              </div>
              <div className="stack-item">
                <strong>Status</strong>
                <p>{queueEntry.status}</p>
              </div>
            </div>
          ) : (
            <p className="page-subtitle" style={{ marginTop: '1rem' }}>No queue notification has been sent yet.</p>
          )}
        </div>
      </div>
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

  const loadFares = async () => {
    try {
      const response = await fetchDriverFares();
      setRoutes(response.routes || []);
      const firstRoute = response.routes?.[0];
      if (firstRoute) {
        setSelectedRouteId(String(firstRoute.id));
        setBoardingTerminalId(String(firstRoute.terminals?.[0]?.id || ''));
        setDropoffTerminalId(String(firstRoute.terminals?.[1]?.id || firstRoute.terminals?.[0]?.id || ''));
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    loadFares();
  }, []);

  const selectedRoute = useMemo(
    () => routes.find((route) => String(route.id) === String(selectedRouteId)) || null,
    [routes, selectedRouteId],
  );

  const matchedFare = useMemo(() => {
    if (!selectedRoute) return null;
    return selectedRoute.fares.find((fare) => (
      String(fare.from_terminal_id) === String(boardingTerminalId)
      && String(fare.to_terminal_id) === String(dropoffTerminalId)
    )) || null;
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
    const isWeekday = day >= 1 && day <= 5;
    return isWeekday && ((hour >= 6 && hour < 9) || (hour >= 17 && hour < 20));
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

  const handlePrompt = async () => {
    setError('');
    setSuccess('');
    try {
      const response = await createFarePrompt({
        sacco_route_id: Number(selectedRouteId),
        boarding_terminal_id: Number(boardingTerminalId),
        dropoff_terminal_id: Number(dropoffTerminalId),
        passenger_phone: passengerPhone,
      });
      setSuccess(response.message || 'Prompt sent.');
      setPassengerPhone('');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">Fares & Payments</h1>
      <p className="page-subtitle">Select route and terminals to send an M-Pesa prompt. The correct fare period is applied automatically.</p>
      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
      {success ? <p className="auth-feedback" style={{ color: 'var(--color-success)' }}>{success}</p> : null}

      <div className="role-middle-grid">
        <div className="card">
          <h3>Passenger Fare Prompt</h3>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Route</label>
            <select className="form-select" value={selectedRouteId} onChange={(event) => setSelectedRouteId(event.target.value)}>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>{route.route_name}</option>
              ))}
            </select>
          </div>

          <div className="auth-grid auth-grid-two">
            <div className="form-group">
              <label className="form-label">Boarding Terminal</label>
              <select className="form-select" value={boardingTerminalId} onChange={(event) => setBoardingTerminalId(event.target.value)}>
                {(selectedRoute?.terminals || []).map((terminal) => (
                  <option key={terminal.id} value={terminal.id}>{terminal.terminal_name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Drop-off Terminal</label>
              <select className="form-select" value={dropoffTerminalId} onChange={(event) => setDropoffTerminalId(event.target.value)}>
                {(selectedRoute?.terminals || []).map((terminal) => (
                  <option key={terminal.id} value={terminal.id}>{terminal.terminal_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Passenger Phone Number</label>
            <input className="form-input" value={passengerPhone} onChange={(event) => setPassengerPhone(event.target.value)} placeholder="+2547... or 07..." />
          </div>

          {effectiveFare ? (
            <div className="role-stat-card" style={{ marginBottom: '1rem', borderLeft: `4px solid ${periodColor[effectiveFare.period]}` }}>
              <span>Fare Applied ({effectiveFare.period})</span>
              <strong style={{ color: periodColor[effectiveFare.period] }}>KES {effectiveFare.amount}</strong>
            </div>
          ) : (
            <div className="role-stat-card amber" style={{ marginBottom: '1rem' }}>
              <span>Fare Amount</span>
              <strong>No fare set for this route</strong>
            </div>
          )}

          <button className="btn btn-primary" onClick={handlePrompt} disabled={!matchedFare || !passengerPhone}>
            Send M-Pesa Prompt
          </button>
        </div>

        <div className="card">
          <h3>All Route Fares</h3>
          <p className="page-subtitle" style={{ marginBottom: '1rem' }}>Peak hours: Mon–Fri 6–9 AM &amp; 5–8 PM.</p>
          {routes.length === 0 ? (
            <p className="page-subtitle">No fares configured yet.</p>
          ) : (
            routes.map((route) => (
              <div key={route.id} style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>{route.route_name} <span className="page-subtitle">- {route.location}</span></h4>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Standard (KES)</th>
                        <th>Peak (KES)</th>
                        <th>Off-Peak (KES)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {route.fares.length === 0 ? (
                        <tr><td colSpan="5" className="empty-table-cell">No fares set for this route.</td></tr>
                      ) : (
                        route.fares.map((fare) => (
                          <tr key={fare.id}>
                            <td>{fare.from_terminal_name}</td>
                            <td>{fare.to_terminal_name}</td>
                            <td>{fare.amount}</td>
                            <td>{fare.peak_amount != null ? fare.peak_amount : <span className="page-subtitle">N/A</span>}</td>
                            <td>{fare.off_peak_amount != null ? fare.off_peak_amount : <span className="page-subtitle">N/A</span>}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const PassengerDropOffs = () => {
  const [dropoffs, setDropoffs] = useState([]);
  const [error, setError] = useState('');

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

      <div className="card" style={{ padding: 0 }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
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
              {dropoffs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-cell">No passenger drop-off records yet.</td>
                </tr>
              ) : null}

              {dropoffs.map((dropoff) => (
                <tr key={dropoff.id}>
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
