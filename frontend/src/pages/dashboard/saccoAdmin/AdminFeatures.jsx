import React, { useEffect, useMemo, useState } from 'react';
import {
  approveSaccoDriver,
  assignSchoolDrivers,
  createSaccoRoute,
  dispatchQueueEntry,
  fetchSaccoComplaints,
  fetchSaccoAdminDrivers,
  fetchSaccoFares,
  fetchSaccoQueue,
  fetchSaccoRoutes,
  fetchSchoolRequests,
  markQueueEntryLeft,
  respondToComplaint,
  saveSaccoFare,
  fetchSaccoRevenueReport,
} from '../../../services/saccoAdminApi';

function StatusBadge({ value }) {
  return <span className={`role-chip ${value === 'active' || value === 'responded' ? '' : 'passive'}`}>{value}</span>;
}

export const ApproveDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDrivers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchSaccoAdminDrivers();
      setDrivers(response.drivers || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleApprove = async (driverId) => {
    try {
      await approveSaccoDriver(driverId);
      await loadDrivers();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">Approve Registered Drivers</h1>
      <p className="page-subtitle">Only drivers registered under the same SACCO appear here.</p>

      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <div className="card" style={{ padding: 0 }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Matatu Name</th>
                <th>Number Plate</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && drivers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-cell">No SACCO drivers found for approval yet.</td>
                </tr>
              ) : null}

              {drivers.map((driver) => (
                <tr key={driver.id}>
                  <td>{driver.name}</td>
                  <td>{driver.phone}</td>
                  <td>{driver.email}</td>
                  <td>{driver.matatu_name || 'Not set'}</td>
                  <td>{driver.number_plate || 'Not set'}</td>
                  <td><StatusBadge value={driver.status} /></td>
                  <td>
                    {driver.status === 'pending_approval' ? (
                      <button className="btn btn-primary action-btn" onClick={() => handleApprove(driver.id)}>
                        Approve
                      </button>
                    ) : (
                      <span className="table-success-text">Approved</span>
                    )}
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

export const RoutesTerminals = () => {
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({ route_name: '', location: '', terminals: [''] });
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const loadRoutes = async () => {
    try {
      const response = await fetchSaccoRoutes();
      setRoutes(response.routes || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const updateTerminal = (index, value) => {
    setForm((current) => ({
      ...current,
      terminals: current.terminals.map((terminal, terminalIndex) => terminalIndex === index ? value : terminal),
    }));
  };

  const addTerminalInput = () => {
    setForm((current) => ({ ...current, terminals: [...current.terminals, ''] }));
  };

  const filteredRoutes = routes.filter((route) => `${route.route_name || ''} ${route.location || ''} ${(route.terminals || []).map((terminal) => terminal.terminal_name).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filteredRoutes.length / pageSize));
  const visibleRoutes = filteredRoutes.slice(page * pageSize, (page + 1) * pageSize);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await createSaccoRoute({
        route_name: form.route_name,
        location: form.location,
        terminals: form.terminals.filter(Boolean),
      });
      setForm({ route_name: '', location: '', terminals: [''] });
      setModalOpen(false);
      await loadRoutes();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">Routes and Terminals</h1>
      <p className="page-subtitle">Manage SACCO routes and the terminals used in fare management and queue dispatch.</p>
      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <section className="card route-directory-panel">
        <div className="route-directory-toolbar">
          <button className="btn btn-outline route-register-button" onClick={() => { setError(''); setModalOpen(true); }}>Register route</button>
          <span className="route-count">{filteredRoutes.length} {filteredRoutes.length === 1 ? 'route' : 'routes'}</span>
          <div className="route-search-row">
            <input className="form-input" aria-label="Search routes" placeholder="Search route, location or terminal" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} />
            <span className="route-search-icon" aria-hidden="true">&#128269;</span>
          </div>
          <div className="route-pagination" aria-label="Route pages">
            <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>‹</button>
            <span>{page + 1} / {pageCount}</span>
            <button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>›</button>
          </div>
        </div>
        <div className="data-table-wrap">
          <table className="data-table route-directory-table">
            <thead><tr><th>#</th><th>Route</th><th>Location / Station</th><th>Terminals</th></tr></thead>
            <tbody>
              {visibleRoutes.length === 0 ? <tr><td colSpan="4" className="empty-table-cell">{routes.length ? 'No routes match your search.' : 'No routes added yet.'}</td></tr> : null}
              {visibleRoutes.map((route, index) => (
                <tr key={route.id}><td>{page * pageSize + index + 1}</td><td><strong>{route.route_name}</strong></td><td>{route.location || '—'}</td><td>{(route.terminals || []).map((terminal) => terminal.terminal_name).join(' → ') || 'No terminals listed'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen ? <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="route-modal-title">
          <div className="dashboard-modal-heading"><div><h2 id="route-modal-title">Register route</h2><p className="page-subtitle">Add a route and its ordered terminals.</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setModalOpen(false)}>×</button></div>
          {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
          <form className="auth-page-form" onSubmit={handleSubmit}>
          <div className="auth-grid auth-grid-two">
            <div className="form-group">
              <label className="form-label">Route Name</label>
              <input className="form-input" value={form.route_name} onChange={(event) => setForm((current) => ({ ...current, route_name: event.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Location / Station</label>
              <input className="form-input" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Terminals</label>
            <div className="stack-list">
              {form.terminals.map((terminal, index) => (
                <input
                  key={`terminal-${index}`}
                  className="form-input"
                  placeholder={`Terminal ${index + 1}`}
                  value={terminal}
                  onChange={(event) => updateTerminal(index, event.target.value)}
                  required
                />
              ))}
            </div>
            <button type="button" className="btn btn-outline" onClick={addTerminalInput}>Add Another Terminal</button>
          </div>

          <div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" type="submit">Save Route and Terminals</button></div>
          </form>
        </section>
      </div> : null}
    </div>
  );
};

export const ManageFares = () => {
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [fareForm, setFareForm] = useState({ from_terminal_id: '', to_terminal_id: '', amount: '', peak_amount: '', off_peak_amount: '' });
  const pageSize = 10;

  const loadFares = async () => {
    try {
      const response = await fetchSaccoFares();
      setRoutes(response.routes || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    loadFares();
  }, []);

  const selectedRoute = routes.find((route) => String(route.id) === String(selectedRouteId));
  const fareRows = routes.flatMap((route) => (route.fares || []).map((fare) => ({ ...fare, routeName: route.route_name, routeLocation: route.location })));
  const filteredFares = fareRows.filter((fare) => `${fare.routeName || ''} ${fare.routeLocation || ''} ${fare.from_terminal_name || ''} ${fare.to_terminal_name || ''} ${fare.amount} ${fare.peak_amount ?? ''} ${fare.off_peak_amount ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filteredFares.length / pageSize));
  const visibleFares = filteredFares.slice(page * pageSize, (page + 1) * pageSize);

  const openFareModal = () => {
    const firstRoute = routes[0];
    const terminals = firstRoute?.terminals || [];
    setError('');
    setSelectedRouteId(firstRoute ? String(firstRoute.id) : '');
    setFareForm({ from_terminal_id: terminals[0] ? String(terminals[0].id) : '', to_terminal_id: terminals[1] ? String(terminals[1].id) : (terminals[0] ? String(terminals[0].id) : ''), amount: '', peak_amount: '', off_peak_amount: '' });
    setModalOpen(true);
  };

  const changeRoute = (routeId) => {
    const route = routes.find((item) => String(item.id) === String(routeId));
    const terminals = route?.terminals || [];
    setSelectedRouteId(routeId);
    setFareForm((current) => ({ ...current, from_terminal_id: terminals[0] ? String(terminals[0].id) : '', to_terminal_id: terminals[1] ? String(terminals[1].id) : (terminals[0] ? String(terminals[0].id) : '') }));
  };

  const handleSaveFare = async (event) => {
    event.preventDefault();
    if (!selectedRoute) return;
    setError('');
    try {
      await saveSaccoFare({
        sacco_route_id: Number(selectedRoute.id),
        from_terminal_id: Number(fareForm.from_terminal_id),
        to_terminal_id: Number(fareForm.to_terminal_id),
        amount: Number(fareForm.amount),
        peak_amount: fareForm.peak_amount !== '' ? Number(fareForm.peak_amount) : null,
        off_peak_amount: fareForm.off_peak_amount !== '' ? Number(fareForm.off_peak_amount) : null,
      });
      await loadFares();
      setModalOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">Manage Fares</h1>
      <p className="page-subtitle">Set fares between terminals on your SACCO routes.</p>
      {error && !modalOpen ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <section className="card route-directory-panel">
        <div className="route-directory-toolbar">
          <button className="btn btn-outline route-register-button" onClick={openFareModal} disabled={routes.length === 0}>Register fare</button>
          <span className="route-count">{filteredFares.length} {filteredFares.length === 1 ? 'fare' : 'fares'}</span>
          <div className="route-search-row">
            <input className="form-input" aria-label="Search fares" placeholder="Search route or terminal" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} />
            <span className="route-search-icon" aria-hidden="true">&#128269;</span>
          </div>
          <div className="route-pagination" aria-label="Fare pages">
            <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>‹</button>
            <span>{page + 1} / {pageCount}</span>
            <button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>›</button>
          </div>
        </div>
        <div className="data-table-wrap">
          <table className="data-table route-directory-table">
            <thead><tr><th>#</th><th>Route</th><th>From terminal</th><th>To terminal</th><th>Standard (KES)</th><th>Peak (KES)</th><th>Off-peak (KES)</th></tr></thead>
            <tbody>
              {visibleFares.length === 0 ? <tr><td colSpan="7" className="empty-table-cell">{routes.length === 0 ? 'Add routes and terminals before setting fares.' : (fareRows.length === 0 ? 'No fares configured yet.' : 'No fares match your search.')}</td></tr> : null}
              {visibleFares.map((fare, index) => <tr key={fare.id}><td>{page * pageSize + index + 1}</td><td><strong>{fare.routeName}</strong></td><td>{fare.from_terminal_name}</td><td>{fare.to_terminal_name}</td><td>{fare.amount}</td><td>{fare.peak_amount ?? '-'}</td><td>{fare.off_peak_amount ?? '-'}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen ? <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="fare-modal-title">
          <div className="dashboard-modal-heading"><div><h2 id="fare-modal-title">Register fare</h2><p className="page-subtitle">Set standard and optional peak fares between two terminals.</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setModalOpen(false)}>×</button></div>
          {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
          <form className="auth-page-form" onSubmit={handleSaveFare}>
            <div className="form-group"><label className="form-label">Route</label><select className="form-select" value={selectedRouteId} onChange={(event) => changeRoute(event.target.value)} required>{routes.map((route) => <option key={route.id} value={route.id}>{route.route_name} - {route.location}</option>)}</select></div>
            <div className="auth-grid auth-grid-two">
              <div className="form-group"><label className="form-label">From terminal</label><select className="form-select" value={fareForm.from_terminal_id} onChange={(event) => setFareForm((current) => ({ ...current, from_terminal_id: event.target.value }))} required>{(selectedRoute?.terminals || []).map((terminal) => <option key={terminal.id} value={terminal.id}>{terminal.terminal_name}</option>)}</select></div>
              <div className="form-group"><label className="form-label">To terminal</label><select className="form-select" value={fareForm.to_terminal_id} onChange={(event) => setFareForm((current) => ({ ...current, to_terminal_id: event.target.value }))} required>{(selectedRoute?.terminals || []).map((terminal) => <option key={terminal.id} value={terminal.id}>{terminal.terminal_name}</option>)}</select></div>
            </div>
            <div className="auth-grid auth-grid-two">
              <div className="form-group"><label className="form-label">Standard fare (KES)</label><input className="form-input" type="number" min="0" step="0.01" placeholder="e.g. 50" value={fareForm.amount} onChange={(event) => setFareForm((current) => ({ ...current, amount: event.target.value }))} required /></div>
              <div className="form-group"><label className="form-label">Peak fare (KES)</label><input className="form-input" type="number" min="0" step="0.01" placeholder="Optional" value={fareForm.peak_amount} onChange={(event) => setFareForm((current) => ({ ...current, peak_amount: event.target.value }))} /></div>
            </div>
            <div className="form-group"><label className="form-label">Off-peak fare (KES)</label><input className="form-input" type="number" min="0" step="0.01" placeholder="Optional" value={fareForm.off_peak_amount} onChange={(event) => setFareForm((current) => ({ ...current, off_peak_amount: event.target.value }))} /><small className="page-subtitle">Peak hours: Mon-Fri 6-9 AM and 5-8 PM. Off-peak applies at other times.</small></div>
            <div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" type="submit">Save fare</button></div>
          </form>
        </section>
      </div> : null}
    </div>
  );
};

export const QueueManagement = () => {
  const [queueEntries, setQueueEntries] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [assignedRoutes, setAssignedRoutes] = useState({});
  const [error, setError] = useState('');

  const loadQueue = async () => {
    try {
      const response = await fetchSaccoQueue();
      setQueueEntries(response.queue_entries || []);
      setRoutes(response.routes || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleDispatch = async (entryId) => {
    try {
      await dispatchQueueEntry(entryId, { assigned_route_id: Number(assignedRoutes[entryId]) });
      await loadQueue();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleLeft = async (entryId) => {
    try {
      await markQueueEntryLeft(entryId);
      await loadQueue();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">Queue Management</h1>
      <p className="page-subtitle">Arrange drivers according to when they notify the SACCO office, assign their route, and mark them left once they depart.</p>
      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <div className="card" style={{ padding: 0 }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Queue</th>
                <th>Driver</th>
                <th>Arrival Notification</th>
                <th>Station</th>
                <th>Assign Route</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {queueEntries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-cell">No driver queue notifications available yet.</td>
                </tr>
              ) : null}

              {queueEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>#{entry.queue_position}</td>
                  <td>{entry.full_name}<br /><span className="page-subtitle">{entry.number_plate}</span></td>
                  <td>{entry.notified_at}</td>
                  <td>{entry.station_location}</td>
                  <td>
                    <select
                      className="form-select"
                      value={assignedRoutes[entry.id] || ''}
                      onChange={(event) => setAssignedRoutes((current) => ({ ...current, [entry.id]: event.target.value }))}
                    >
                      <option value="">Choose route</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.id}>{route.route_name}</option>
                      ))}
                    </select>
                  </td>
                  <td><StatusBadge value={entry.status} /></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-primary action-btn" onClick={() => handleDispatch(entry.id)} disabled={!assignedRoutes[entry.id]}>
                        Dispatch
                      </button>
                      <button className="btn btn-outline action-btn" onClick={() => handleLeft(entry.id)}>
                        Mark Left
                      </button>
                    </div>
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

export const SchoolAssignments = () => {
  const [requests, setRequests] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState({});
  const [error, setError] = useState('');

  const loadRequests = async () => {
    try {
      const response = await fetchSchoolRequests();
      setRequests(response.requests || []);
      setDrivers(response.drivers || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const toggleDriver = (requestId, driverId) => {
    const current = selectedDrivers[requestId] || [];
    const next = current.includes(driverId)
      ? current.filter((id) => id !== driverId)
      : [...current, driverId];

    setSelectedDrivers((state) => ({ ...state, [requestId]: next }));
  };

  const handleAssign = async (requestId) => {
    try {
      await assignSchoolDrivers(requestId, { driver_ids: selectedDrivers[requestId] || [] });
      await loadRequests();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">School Transportation</h1>
      <p className="page-subtitle">Receive vehicle requests from school admins and send back a prepared list of SACCO drivers with their contact and plate details.</p>
      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <div className="card-grid">
        {requests.length === 0 ? (
          <div className="card">
            <p className="page-subtitle">No school transport requests available yet.</p>
          </div>
        ) : null}

        {requests.map((request) => (
          <div key={request.id} className="card">
            <div className="info-topline">
              <h3>{request.school_name}</h3>
              <StatusBadge value={request.status} />
            </div>
            <p><strong>Location:</strong> {request.location}</p>
            <p><strong>Requested Vehicles:</strong> {request.requested_vehicles}</p>
            <p className="page-subtitle">{request.notes || 'No additional notes provided.'}</p>

            <div className="stack-list" style={{ marginTop: '1rem' }}>
              {drivers.map((driver) => (
                <label key={`${request.id}-${driver.id}`} className="stack-item checkbox-row">
                  <input
                    type="checkbox"
                    checked={(selectedDrivers[request.id] || []).includes(driver.id)}
                    onChange={() => toggleDriver(request.id, driver.id)}
                  />
                  <span>{driver.name} | {driver.phone} | {driver.number_plate}</span>
                </label>
              ))}
            </div>

            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => handleAssign(request.id)}>
              Send Driver List to School Admin
            </button>

            {request.assigned_drivers?.length > 0 ? (
              <div className="stack-list" style={{ marginTop: '1rem' }}>
                {request.assigned_drivers.map((driver, index) => (
                  <div key={`${request.id}-assigned-${index}`} className="stack-item">
                    <strong>{driver.name}</strong>
                    <p>{driver.phone} | {driver.number_plate}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ComplaintsAdmin = () => {
  const [complaints, setComplaints] = useState([]);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadComplaints = async () => {
    try {
      const response = await fetchSaccoComplaints();
      setComplaints(response.complaints || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleRespond = async (complaintId, sourceTable, responseKey = complaintId) => {
    try {
      setError('');
      setNotice('');
      const result = await respondToComplaint(complaintId, {
        response_message: responses[responseKey] || '',
        source_table: sourceTable
      });
      const deliverySummary = Object.entries(result.delivery || {})
        .map(([channel, delivery]) => `${channel.toUpperCase()}: ${(delivery.status || 'unknown').replace(/_/g, ' ')}`)
        .join(' | ');
      setNotice(`${result.message}${deliverySummary ? ` ${deliverySummary}.` : ''}`);
      setResponses((current) => ({ ...current, [responseKey]: '' }));
      await loadComplaints();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">Route Complaints</h1>
      <p className="page-subtitle">Only complaints directed to your route are displayed here. Responses are saved and sent to the passenger's available contact details.</p>
      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
      {notice ? <p className="auth-feedback" role="status">{notice}</p> : null}

      <div className="card" style={{ padding: 0 }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Complaint</th><th>Route</th><th>Passenger contact</th><th>Message</th><th>Status</th><th>Response</th><th>Action</th></tr></thead>
            <tbody>
              {complaints.length === 0 ? <tr><td colSpan="7" className="empty-table-cell">No complaints for your route yet.</td></tr> : null}
              {complaints.map((complaint) => {
                const complaintKey = `${complaint.source_table}-${complaint.id}`;
                return <tr key={complaintKey}>
                  <td>#{complaint.id}</td>
                  <td>{complaint.route_name || '—'}</td>
                  <td>{[complaint.passenger_phone, complaint.passenger_email].filter(Boolean).join(' | ') || '—'}</td>
                  <td style={{ minWidth: '220px', whiteSpace: 'normal' }}>{complaint.message}</td>
                  <td><StatusBadge value={complaint.status} /></td>
                  <td style={{ minWidth: '250px' }}>
                    <textarea className="form-input complaint-box" placeholder="Type your direct response to the passenger here..." value={responses[complaintKey] ?? complaint.response_message ?? ''} onChange={(event) => setResponses((current) => ({ ...current, [complaintKey]: event.target.value }))} rows="3" />
                  </td>
                  <td><button className="btn btn-primary action-btn" onClick={() => handleRespond(complaint.id, complaint.source_table, complaintKey)}>Send Response</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const RevenueReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const loadReport = async () => {
    setLoading(true);
    try {
      const query = `?month=${month}&year=${year}`;
      const data = await fetchSaccoRevenueReport(query);
      setReport(data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const exportToCSV = () => {
    if (!report?.drivers_revenue) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Driver Name,Number Plate,Passenger Count,Total Revenue\r\n";

    report.drivers_revenue.forEach(d => {
      csvContent += `"${d.driver_name}","${d.number_plate}",${d.passenger_count},${d.total_revenue}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sacco_Revenue_${report.period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => { loadReport(); }, [month, year]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title">Revenue Report</h1>
          <p className="page-subtitle">Revenue breakdown for {report?.sacco_name} - Period: {report?.period}.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select className="form-select" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 'auto' }}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
            ))}
          </select>
          <select className="form-select" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 'auto' }}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={() => exportToCSV()} style={{ width: 'auto' }}>Export CSV</button>
          <button className="btn btn-primary" onClick={() => window.print()} style={{ width: 'auto' }}>Print Report</button>
        </div>
      </div>

      {error && <p className="auth-feedback auth-feedback-error">{error}</p>}
      {loading ? <p className="page-subtitle">Loading report data...</p> : (
        <>
          <div className="card" style={{ marginBottom: '2rem', background: 'var(--color-brand)', color: 'white' }}>
            <h3 style={{ opacity: 0.9 }}>Total SACCO Revenue</h3>
            <h1 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>KES {report?.total_revenue?.toLocaleString()}</h1>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-glass)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Driver Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Number Plate</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Passengers</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Revenue (KES)</th>
                </tr>
              </thead>
              <tbody>
                {report?.drivers_revenue?.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem' }}>{d.driver_name}</td>
                    <td style={{ padding: '1rem' }}>{d.number_plate}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{d.passenger_count}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(d.total_revenue).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
