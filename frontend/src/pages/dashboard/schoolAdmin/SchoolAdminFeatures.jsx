import React, { useEffect, useState } from 'react';
import {
  approveSchoolDriver,
  assignDailyTripStudents,
  createClosingTrip,
  createDailyTrip,
  createEducationalTrip,
  createSchoolRoute,
  createSchoolSaccoRequest,
  fetchSaccoDirectory,
  fetchSchoolAdminDrivers,
  fetchSchoolAdminNotifications,
  fetchSchoolAdminTrips,
  fetchSchoolPayments,
  approveSchoolPayment,
  saveClosingTripFare,
  sendSchoolSaccoMessage,
  fetchSchoolComplaints,
  respondToSchoolComplaint,
  fetchSchoolPaymentsReport,
} from '../../../services/schoolAdminApi';

function StatusBadge({ value }) {
  return <span className={`role-chip ${value === 'active' || value === 'published' || value === 'approved' ? '' : 'passive'}`}>{value}</span>;
}

export const ApproveDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDrivers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchSchoolAdminDrivers();
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
      await approveSchoolDriver(driverId);
      await loadDrivers();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">Approve School Drivers</h1>
      <p className="page-subtitle">School drivers registered under your school location will appear here for your approval.</p>

      {error && <p className="auth-feedback auth-feedback-error">{error}</p>}

      <div className="card" style={{ padding: 0 }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && drivers.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-table-cell">No school drivers found for approval yet.</td>
                </tr>
              )}

              {drivers.map((driver) => (
                <tr key={driver.id}>
                  <td>{driver.name}</td>
                  <td>{driver.phone}</td>
                  <td>{driver.email}</td>
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

export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetchSchoolAdminNotifications();
        setNotifications(response.notifications || []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
  }, []);

  return (
    <div>
      <h1 className="page-title">Notifications</h1>
      <p className="page-subtitle">Alerts from Sacco drivers and School drivers regarding transit status.</p>

      {error && <p className="auth-feedback auth-feedback-error">{error}</p>}

      <div className="card-grid">
        {!loading && notifications.length === 0 && (
          <div className="card">
            <p className="page-subtitle">No notifications at the moment.</p>
          </div>
        )}

        {notifications.map((notif) => (
          <div key={notif.id} className="card" style={{ borderLeft: notif.status === 'open' ? '4px solid var(--color-brand)' : 'none' }}>
            <div className="info-topline">
              <h4>{notif.subject}</h4>
              <StatusBadge value={notif.status} />
            </div>
            <p className="page-subtitle">From: {notif.source_name} ({notif.source_role})</p>
            <p>{notif.message}</p>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {new Date(notif.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ManageTrips = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  
  const loadData = async () => {
    try {
      const response = await fetchSchoolAdminTrips();
      setData(response);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <h1 className="page-title">Manage Student Trips</h1>
      <p className="page-subtitle">Post daily pick-ups, educational trips, and organize closing day transport.</p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
        <button className={`btn ${activeTab === 'daily' ? 'btn-primary' : 'btn-outline'}`} style={{ width: 'auto' }} onClick={() => setActiveTab('daily')}>Daily Transport</button>
        <button className={`btn ${activeTab === 'educational' ? 'btn-primary' : 'btn-outline'}`} style={{ width: 'auto' }} onClick={() => setActiveTab('educational')}>Educational Trips</button>
        <button className={`btn ${activeTab === 'closing' ? 'btn-primary' : 'btn-outline'}`} style={{ width: 'auto' }} onClick={() => setActiveTab('closing')}>Closing Trips</button>
      </div>

      {error && <p className="auth-feedback auth-feedback-error">{error}</p>}

      {data && (
        <>
          {activeTab === 'daily' && <DailyTrips data={data} error={error} reloadData={loadData} setError={setError} />}
          {activeTab === 'educational' && <EducationalTrips data={data} error={error} reloadData={loadData} setError={setError} />}
          {activeTab === 'closing' && <ClosingTrips data={data} error={error} reloadData={loadData} setError={setError} />}
        </>
      )}
    </div>
  );
};

const DailyTrips = ({ data, error, reloadData, setError }) => {
  const [routeForm, setRouteForm] = useState({ route_name: '', terminals: [''] });
  const [tripForm, setTripForm] = useState({ school_route_id: '', grade: '', pickup_time: '', dropoff_time: '', amount: '' });
  const [assignmentForm, setAssignmentForm] = useState({});
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [assignmentTripId, setAssignmentTripId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const handleCreateRoute = async (event) => {
    event.preventDefault();
    try {
      await createSchoolRoute({ ...routeForm, terminals: routeForm.terminals.filter(Boolean) });
      setRouteForm({ route_name: '', terminals: [''] });
      setRouteModalOpen(false);
      await reloadData();
    } catch (err) { setError(err.message); }
  };

  const handleCreateTrip = async (event) => {
    event.preventDefault();
    try {
      await createDailyTrip({ ...tripForm, school_route_id: Number(tripForm.school_route_id), amount: Number(tripForm.amount) });
      setTripForm({ school_route_id: '', grade: '', pickup_time: '', dropoff_time: '', amount: '' });
      setTripModalOpen(false);
      await reloadData();
    } catch (err) { setError(err.message); }
  };

  const handleAssignStudents = async (event) => {
    event.preventDefault();
    const form = assignmentForm[assignmentTripId];
    if (!form || !form.school_driver_id || !form.assigned_pickup_time || !form.parent_ids?.length) {
      setError('Please select a driver, pickup time, and at least one student.');
      return;
    }
    try {
      await assignDailyTripStudents(assignmentTripId, { school_driver_id: Number(form.school_driver_id), assigned_pickup_time: form.assigned_pickup_time, parent_ids: form.parent_ids.map(Number) });
      setAssignmentTripId(null);
      await reloadData();
    } catch (err) { setError(err.message); }
  };

  const filteredTrips = data.daily_trips.filter((trip) => `${trip.route_name || ''} ${trip.grade || ''} ${trip.status || ''}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filteredTrips.length / pageSize));
  const visibleTrips = filteredTrips.slice(page * pageSize, (page + 1) * pageSize);
  const activeAssignmentTrip = data.daily_trips.find((trip) => String(trip.id) === String(assignmentTripId));
  const eligibleStudents = activeAssignmentTrip ? data.students.filter((student) => student.grade === activeAssignmentTrip.grade) : [];

  return (
    <div>
      <section className="card route-directory-panel">
        <div className="route-directory-toolbar route-directory-toolbar-multiple-actions">
          <button className="btn btn-outline route-register-button" onClick={() => { setError(''); setRouteModalOpen(true); }}>Create route</button>
          <button className="btn btn-outline route-register-button" onClick={() => { setError(''); setTripModalOpen(true); }} disabled={data.routes.length === 0}>Publish daily trip</button>
          <span className="route-count">{filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}</span>
          <div className="route-search-row"><input className="form-input" aria-label="Search daily trips" placeholder="Search route, grade or status" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /><span className="route-search-icon" aria-hidden="true">&#128269;</span></div>
          <div className="route-pagination" aria-label="Daily trip pages"><button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>&lsaquo;</button><span>{page + 1} / {pageCount}</span><button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>&rsaquo;</button></div>
        </div>
        <div className="data-table-wrap">
          <table className="data-table route-directory-table">
            <thead><tr><th>#</th><th>Route / Grade</th><th>Pickup</th><th>Drop-off</th><th>Fare (KES)</th><th>Status</th><th>Students / Payments</th><th>Action</th></tr></thead>
            <tbody>
              {visibleTrips.length === 0 ? <tr><td colSpan="8" className="empty-table-cell">{data.daily_trips.length ? 'No daily trips match your search.' : 'No daily trips published yet.'}</td></tr> : null}
              {visibleTrips.map((trip, index) => <tr key={trip.id}><td>{page * pageSize + index + 1}</td><td><strong>{trip.route_name}</strong><br /><span className="page-subtitle">{trip.grade}</span></td><td>{trip.pickup_time}</td><td>{trip.dropoff_time}</td><td>{trip.amount}</td><td><StatusBadge value={trip.status} /></td><td>{trip.assigned_students} assigned / {trip.approved_payments} paid</td><td><button className="btn btn-primary action-btn" onClick={() => { setError(''); setAssignmentTripId(trip.id); }}>Assign students</button></td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      {routeModalOpen ? <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setRouteModalOpen(false); }}><section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="school-route-modal-title">
        <div className="dashboard-modal-heading"><div><h2 id="school-route-modal-title">Create school route</h2><p className="page-subtitle">Set the route name and its ordered terminals.</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setRouteModalOpen(false)}>×</button></div>
        {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
        <form className="auth-page-form" onSubmit={handleCreateRoute}>
          <div className="form-group"><label className="form-label">Route name</label><input className="form-input" required value={routeForm.route_name} onChange={(event) => setRouteForm({ ...routeForm, route_name: event.target.value })} /></div>
          <div className="form-group"><label className="form-label">Terminals</label><div className="stack-list">{routeForm.terminals.map((terminal, index) => <input key={index} className="form-input" required placeholder={`Terminal ${index + 1}`} value={terminal} onChange={(event) => { const next = [...routeForm.terminals]; next[index] = event.target.value; setRouteForm({ ...routeForm, terminals: next }); }} />)}</div><button type="button" className="btn btn-outline" onClick={() => setRouteForm({ ...routeForm, terminals: [...routeForm.terminals, ''] })}>Add terminal</button></div>
          <div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setRouteModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save route</button></div>
        </form>
      </section></div> : null}

      {tripModalOpen ? <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setTripModalOpen(false); }}><section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="daily-trip-modal-title">
        <div className="dashboard-modal-heading"><div><h2 id="daily-trip-modal-title">Publish daily trip</h2><p className="page-subtitle">Set the route, grade, fare and regular pickup times.</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setTripModalOpen(false)}>×</button></div>
        {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
        <form className="auth-page-form" onSubmit={handleCreateTrip}>
          <div className="form-group"><label className="form-label">Route</label><select className="form-select" required value={tripForm.school_route_id} onChange={(event) => setTripForm({ ...tripForm, school_route_id: event.target.value })}><option value="">Choose route</option>{data.routes.map((route) => <option key={route.id} value={route.id}>{route.route_name}</option>)}</select></div>
          <div className="auth-grid auth-grid-two"><div className="form-group"><label className="form-label">Grade</label><input className="form-input" required placeholder="e.g. Grade 1" value={tripForm.grade} onChange={(event) => setTripForm({ ...tripForm, grade: event.target.value })} /></div><div className="form-group"><label className="form-label">Amount (KES)</label><input className="form-input" type="number" min="0" required value={tripForm.amount} onChange={(event) => setTripForm({ ...tripForm, amount: event.target.value })} /></div><div className="form-group"><label className="form-label">Pickup time</label><input className="form-input" type="time" required value={tripForm.pickup_time} onChange={(event) => setTripForm({ ...tripForm, pickup_time: event.target.value })} /></div><div className="form-group"><label className="form-label">Drop-off time</label><input className="form-input" type="time" required value={tripForm.dropoff_time} onChange={(event) => setTripForm({ ...tripForm, dropoff_time: event.target.value })} /></div></div>
          <div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setTripModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary">Publish trip</button></div>
        </form>
      </section></div> : null}

      {activeAssignmentTrip ? <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAssignmentTripId(null); }}><section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="assign-students-title">
        <div className="dashboard-modal-heading"><div><h2 id="assign-students-title">Assign students</h2><p className="page-subtitle">{activeAssignmentTrip.route_name} - {activeAssignmentTrip.grade}</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setAssignmentTripId(null)}>×</button></div>
        {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
        <form className="auth-page-form" onSubmit={handleAssignStudents}>
          <div className="auth-grid auth-grid-two"><div className="form-group"><label className="form-label">School driver</label><select className="form-select" required value={assignmentForm[activeAssignmentTrip.id]?.school_driver_id || ''} onChange={(event) => setAssignmentForm({ ...assignmentForm, [activeAssignmentTrip.id]: { ...(assignmentForm[activeAssignmentTrip.id] || {}), school_driver_id: event.target.value } })}><option value="">Select driver</option>{data.school_drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}</select></div><div className="form-group"><label className="form-label">Assigned pickup time</label><input className="form-input" type="time" required value={assignmentForm[activeAssignmentTrip.id]?.assigned_pickup_time || ''} onChange={(event) => setAssignmentForm({ ...assignmentForm, [activeAssignmentTrip.id]: { ...(assignmentForm[activeAssignmentTrip.id] || {}), assigned_pickup_time: event.target.value } })} /></div></div>
          <div className="form-group"><label className="form-label">Students</label><div className="stack-list" style={{ maxHeight: '260px', overflowY: 'auto' }}>{eligibleStudents.length === 0 ? <span className="page-subtitle">No eligible students found. Parents need to pay first.</span> : eligibleStudents.map((student) => <label key={student.id} className="stack-item checkbox-row"><input type="checkbox" checked={(assignmentForm[activeAssignmentTrip.id]?.parent_ids || []).includes(student.id)} onChange={(event) => { const current = assignmentForm[activeAssignmentTrip.id]?.parent_ids || []; const parent_ids = event.target.checked ? [...current, student.id] : current.filter((id) => id !== student.id); setAssignmentForm({ ...assignmentForm, [activeAssignmentTrip.id]: { ...(assignmentForm[activeAssignmentTrip.id] || {}), parent_ids } }); }} /><span>{student.student_name} (Parent: {student.parent_name})</span></label>)}</div></div>
          <div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setAssignmentTripId(null)}>Cancel</button><button type="submit" className="btn btn-primary">Compile &amp; send to driver</button></div>
        </form>
      </section></div> : null}
    </div>
  );
};
const EducationalTrips = ({ data, error, reloadData, setError }) => {
  const [form, setForm] = useState({ trip_title: '', destination: '', duration_days: '', grade: '', amount: '', trip_date: '', notes: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await createEducationalTrip({ ...form, duration_days: Number(form.duration_days), amount: Number(form.amount) });
      setForm({ trip_title: '', destination: '', duration_days: '', grade: '', amount: '', trip_date: '', notes: '' });
      setModalOpen(false);
      await reloadData();
    } catch (err) { setError(err.message); }
  };

  const filteredTrips = data.educational_trips.filter((trip) => `${trip.trip_title || ''} ${trip.destination || ''} ${trip.grade || ''} ${trip.status || ''}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filteredTrips.length / pageSize));
  const visibleTrips = filteredTrips.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div>
      <section className="card route-directory-panel">
        <div className="route-directory-toolbar">
          <button className="btn btn-outline route-register-button" onClick={() => { setError(''); setModalOpen(true); }}>Post educational trip</button>
          <span className="route-count">{filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}</span>
          <div className="route-search-row"><input className="form-input" aria-label="Search educational trips" placeholder="Search title, destination or grade" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /><span className="route-search-icon" aria-hidden="true">&#128269;</span></div>
          <div className="route-pagination" aria-label="Educational trip pages"><button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>&lsaquo;</button><span>{page + 1} / {pageCount}</span><button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>&rsaquo;</button></div>
        </div>
        <div className="data-table-wrap"><table className="data-table route-directory-table">
          <thead><tr><th>#</th><th>Trip</th><th>Destination</th><th>Grade</th><th>Date</th><th>Duration</th><th>Cost (KES)</th><th>Status</th></tr></thead>
          <tbody>
            {visibleTrips.length === 0 ? <tr><td colSpan="8" className="empty-table-cell">{data.educational_trips.length ? 'No trips match your search.' : 'No educational trips published.'}</td></tr> : null}
            {visibleTrips.map((trip, index) => <tr key={trip.id}><td>{page * pageSize + index + 1}</td><td><strong>{trip.trip_title}</strong></td><td>{trip.destination}</td><td>{trip.grade}</td><td>{trip.trip_date || 'Not set'}</td><td>{trip.duration_days} days</td><td>{trip.amount}</td><td><StatusBadge value={trip.status} /></td></tr>)}
          </tbody>
        </table></div>
      </section>

      {modalOpen ? <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="educational-trip-modal-title">
        <div className="dashboard-modal-heading"><div><h2 id="educational-trip-modal-title">Post educational trip</h2><p className="page-subtitle">Provide the trip destination, date and cost.</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setModalOpen(false)}>×</button></div>
        {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
        <form onSubmit={handleSubmit} className="auth-page-form">
          <div className="form-group"><label className="form-label">Trip title</label><input className="form-input" required value={form.trip_title} onChange={(event) => setForm({ ...form, trip_title: event.target.value })} /></div>
          <div className="auth-grid auth-grid-two"><div className="form-group"><label className="form-label">Destination</label><input className="form-input" required value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} /></div><div className="form-group"><label className="form-label">Target grade</label><input className="form-input" required placeholder="e.g. Grade 4" value={form.grade} onChange={(event) => setForm({ ...form, grade: event.target.value })} /></div><div className="form-group"><label className="form-label">Duration (days)</label><input className="form-input" type="number" min="1" required value={form.duration_days} onChange={(event) => setForm({ ...form, duration_days: event.target.value })} /></div><div className="form-group"><label className="form-label">Cost (KES)</label><input className="form-input" type="number" min="0" required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></div><div className="form-group"><label className="form-label">Trip date (optional)</label><input className="form-input" type="date" value={form.trip_date} onChange={(event) => setForm({ ...form, trip_date: event.target.value })} /></div></div>
          <div className="form-group"><label className="form-label">Notes (optional)</label><textarea className="form-input" rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
          <div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary">Publish trip</button></div>
        </form>
      </section></div> : null}
    </div>
  );
};
const ClosingTrips = ({ data, error, reloadData, setError }) => {
  const [form, setForm] = useState({ closing_day: '', preferred_sacco_admin_id: '', notes: '' });
  const [fareForms, setFareForms] = useState({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [fareTripId, setFareTripId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await createClosingTrip({ ...form, preferred_sacco_admin_id: form.preferred_sacco_admin_id ? Number(form.preferred_sacco_admin_id) : null });
      setForm({ closing_day: '', preferred_sacco_admin_id: '', notes: '' });
      setCreateModalOpen(false);
      await reloadData();
    } catch (err) { setError(err.message); }
  };

  const handleSaveFare = async (event) => {
    event.preventDefault();
    const fForm = fareForms[fareTripId];
    if (!fForm || !fForm.sacco_route_id || !fForm.from_terminal_id || !fForm.to_terminal_id || !fForm.amount) {
      setError('Please fill all fare fields.');
      return;
    }
    try {
      await saveClosingTripFare(fareTripId, { ...fForm, sacco_route_id: Number(fForm.sacco_route_id), from_terminal_id: Number(fForm.from_terminal_id), to_terminal_id: Number(fForm.to_terminal_id), amount: Number(fForm.amount) });
      setFareTripId(null);
      await reloadData();
    } catch (err) { setError(err.message); }
  };

  const filteredTrips = data.closing_trips.filter((trip) => `${trip.closing_day || ''} ${trip.sacco_name || ''} ${trip.status || ''}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filteredTrips.length / pageSize));
  const visibleTrips = filteredTrips.slice(page * pageSize, (page + 1) * pageSize);
  const selectedTrip = data.closing_trips.find((trip) => String(trip.id) === String(fareTripId));
  const selectedSacco = selectedTrip ? data.sacco_admins.find((sacco) => sacco.id === selectedTrip.preferred_sacco_admin_id) : null;
  const availableRoutes = selectedSacco?.routes || [];
  const selectedRoute = availableRoutes.find((route) => String(route.id) === String(fareForms[fareTripId]?.sacco_route_id));

  const updateFareForm = (field, value) => setFareForms((current) => ({ ...current, [fareTripId]: { ...(current[fareTripId] || {}), [field]: value } }));
  const changeFareRoute = (routeId) => {
    const route = availableRoutes.find((item) => String(item.id) === String(routeId));
    const terminals = route?.terminals || [];
    setFareForms((current) => ({ ...current, [fareTripId]: { ...(current[fareTripId] || {}), sacco_route_id: routeId, from_terminal_id: terminals[0] ? String(terminals[0].id) : '', to_terminal_id: terminals[1] ? String(terminals[1].id) : '' } }));
  };

  return (
    <div>
      <section className="card route-directory-panel">
        <div className="route-directory-toolbar">
          <button className="btn btn-outline route-register-button" onClick={() => { setError(''); setCreateModalOpen(true); }}>Schedule closing trip</button>
          <span className="route-count">{filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}</span>
          <div className="route-search-row"><input className="form-input" aria-label="Search closing day trips" placeholder="Search date, SACCO or status" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /><span className="route-search-icon" aria-hidden="true">&#128269;</span></div>
          <div className="route-pagination" aria-label="Closing trip pages"><button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>&lsaquo;</button><span>{page + 1} / {pageCount}</span><button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>&rsaquo;</button></div>
        </div>
        <div className="data-table-wrap"><table className="data-table route-directory-table">
          <thead><tr><th>#</th><th>Closing date</th><th>SACCO partner</th><th>Status</th><th>Route fares</th><th>Action</th></tr></thead>
          <tbody>
            {visibleTrips.length === 0 ? <tr><td colSpan="6" className="empty-table-cell">{data.closing_trips.length ? 'No closing trips match your search.' : 'No closing trips scheduled.'}</td></tr> : null}
            {visibleTrips.map((trip, index) => <tr key={trip.id}><td>{page * pageSize + index + 1}</td><td>{trip.closing_day}</td><td>{trip.sacco_name || 'Not selected'}</td><td><StatusBadge value={trip.status} /></td><td>{(trip.fares || []).length} configured</td><td><button className="btn btn-outline action-btn" disabled={!trip.sacco_name} onClick={() => { setError(''); setFareTripId(trip.id); }}>Manage fares</button></td></tr>)}
          </tbody>
        </table></div>
      </section>

      {createModalOpen ? <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateModalOpen(false); }}><section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="closing-trip-modal-title">
        <div className="dashboard-modal-heading"><div><h2 id="closing-trip-modal-title">Schedule closing day trip</h2><p className="page-subtitle">Choose the closing date and, optionally, a SACCO partner.</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setCreateModalOpen(false)}>×</button></div>
        {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
        <form onSubmit={handleCreate} className="auth-page-form">
          <div className="form-group"><label className="form-label">Closing date</label><input className="form-input" type="date" required value={form.closing_day} onChange={(event) => setForm({ ...form, closing_day: event.target.value })} /></div>
          <div className="form-group"><label className="form-label">Preferred SACCO partner (optional)</label><select className="form-select" value={form.preferred_sacco_admin_id} onChange={(event) => setForm({ ...form, preferred_sacco_admin_id: event.target.value })}><option value="">Select SACCO</option>{data.sacco_admins.map((sacco) => <option key={sacco.id} value={sacco.id}>{sacco.sacco_name} ({sacco.name})</option>)}</select></div>
          <div className="form-group"><label className="form-label">Notes (optional)</label><textarea className="form-input" rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
          <div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setCreateModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary">Schedule trip</button></div>
        </form>
      </section></div> : null}

      {selectedTrip ? <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFareTripId(null); }}><section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="closing-fare-modal-title">
        <div className="dashboard-modal-heading"><div><h2 id="closing-fare-modal-title">Manage trip fares</h2><p className="page-subtitle">Closing date: {selectedTrip.closing_day} | {selectedTrip.sacco_name}</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setFareTripId(null)}>×</button></div>
        {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
        <form onSubmit={handleSaveFare} className="auth-page-form">
          <div className="auth-grid auth-grid-two">
            <div className="form-group"><label className="form-label">SACCO route</label><select className="form-select" required value={fareForms[fareTripId]?.sacco_route_id || ''} onChange={(event) => changeFareRoute(event.target.value)}><option value="">Select route</option>{availableRoutes.map((route) => <option key={route.id} value={route.id}>{route.route_name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Fare (KES)</label><input className="form-input" type="number" min="0" required value={fareForms[fareTripId]?.amount || ''} onChange={(event) => updateFareForm('amount', event.target.value)} /></div>
            <div className="form-group"><label className="form-label">From terminal</label><select className="form-select" required value={fareForms[fareTripId]?.from_terminal_id || ''} onChange={(event) => updateFareForm('from_terminal_id', event.target.value)}><option value="">Select terminal</option>{(selectedRoute?.terminals || []).map((terminal) => <option key={terminal.id} value={terminal.id}>{terminal.terminal_name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">To terminal</label><select className="form-select" required value={fareForms[fareTripId]?.to_terminal_id || ''} onChange={(event) => updateFareForm('to_terminal_id', event.target.value)}><option value="">Select terminal</option>{(selectedRoute?.terminals || []).map((terminal) => <option key={terminal.id} value={terminal.id}>{terminal.terminal_name}</option>)}</select></div>
          </div>
          <div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setFareTripId(null)}>Close</button><button type="submit" className="btn btn-primary">Save fare</button></div>
        </form>
        <div className="data-table-wrap" style={{ marginTop: '1.5rem' }}><table className="data-table"><thead><tr><th>Route</th><th>From</th><th>To</th><th>Fare (KES)</th></tr></thead><tbody>{(selectedTrip.fares || []).length === 0 ? <tr><td colSpan="4" className="empty-table-cell">No fares configured for this trip.</td></tr> : selectedTrip.fares.map((fare) => <tr key={fare.id}><td>{fare.route_name}</td><td>{fare.from_terminal_name}</td><td>{fare.to_terminal_name}</td><td>{fare.amount}</td></tr>)}</tbody></table></div>
      </section></div> : null}
    </div>
  );
};
export const SaccoComm = () => {
  const [query, setQuery] = useState('');
  const [saccos, setSaccos] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [requestForm, setRequestForm] = useState({ requested_vehicles: 1, notes: '' });
  const [messageForm, setMessageForm] = useState({ message: '' });
  const [modalMode, setModalMode] = useState('request');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const searchDirectory = async () => {
      setLoading(true);
      try {
        const response = await fetchSaccoDirectory(query);
        setSaccos(response.saccos || []);
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    const timer = setTimeout(searchDirectory, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const admins = saccos.flatMap((sacco) => (sacco.admins || []).map((admin) => ({ ...admin, sacco_name: admin.sacco_name || sacco.sacco_name })));
  const pageCount = Math.max(1, Math.ceil(admins.length / pageSize));
  const visibleAdmins = admins.slice(page * pageSize, (page + 1) * pageSize);

  const openCommunication = (admin, mode) => {
    setSelectedAdmin(admin);
    setModalMode(mode);
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleRequest = async (event) => {
    event.preventDefault();
    if (!selectedAdmin) return;
    try {
      await createSchoolSaccoRequest({ preferred_sacco_admin_id: selectedAdmin.id, requested_vehicles: Number(requestForm.requested_vehicles), notes: requestForm.notes });
      setSuccess('Vehicle request sent successfully.');
      setRequestForm({ requested_vehicles: 1, notes: '' });
      setModalOpen(false);
    } catch (err) { setError(err.message); }
  };

  const handleMessage = async (event) => {
    event.preventDefault();
    if (!selectedAdmin) return;
    try {
      await sendSchoolSaccoMessage({ sacco_admin_id: selectedAdmin.id, message: messageForm.message });
      setSuccess('Message sent successfully.');
      setMessageForm({ message: '' });
      setModalOpen(false);
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <h1 className="page-title">SACCO Communication Directory</h1>
      <p className="page-subtitle">Find approved SACCO administrators and contact them about transport requests or messages.</p>
      {error && !modalOpen ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
      {success ? <p className="auth-feedback table-success-text">{success}</p> : null}
      <section className="card route-directory-panel">
        <div className="route-directory-toolbar route-directory-toolbar-no-action">
          <span className="route-count">{admins.length} {admins.length === 1 ? 'SACCO contact' : 'SACCO contacts'}</span>
          <div className="route-search-row"><input className="form-input" aria-label="Search SACCO contacts" placeholder="Search name, route or location" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} /><span className="route-search-icon" aria-hidden="true">&#128269;</span></div>
          <div className="route-pagination" aria-label="SACCO contact pages"><button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>&lsaquo;</button><span>{page + 1} / {pageCount}</span><button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>&rsaquo;</button></div>
        </div>
        <div className="data-table-wrap"><table className="data-table route-directory-table">
          <thead><tr><th>#</th><th>SACCO</th><th>Administrator</th><th>Route</th><th>Location</th><th>Actions</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="6" className="empty-table-cell">Searching SACCO directory...</td></tr>}
            {!loading && visibleAdmins.length === 0 && <tr><td colSpan="6" className="empty-table-cell">No approved SACCO contacts found.</td></tr>}
            {!loading && visibleAdmins.map((admin, index) => <tr key={admin.id}><td>{page * pageSize + index + 1}</td><td><strong>{admin.sacco_name}</strong></td><td>{admin.name}</td><td>{admin.route_name || '—'}</td><td>{admin.location || '—'}</td><td><div className="table-actions"><button className="btn btn-outline action-btn" onClick={() => openCommunication(admin, 'request')}>Request vehicles</button><button className="btn btn-primary action-btn" onClick={() => openCommunication(admin, 'message')}>Send message</button></div></td></tr>)}
          </tbody>
        </table></div>
      </section>

      {modalOpen && selectedAdmin ? <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="sacco-communication-modal-title">
        <div className="dashboard-modal-heading"><div><h2 id="sacco-communication-modal-title">{modalMode === 'request' ? 'Request SACCO vehicles' : 'Send SACCO message'}</h2><p className="page-subtitle">To: {selectedAdmin.sacco_name} ({selectedAdmin.name})</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setModalOpen(false)}>×</button></div>
        {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
        {modalMode === 'request' ? <form onSubmit={handleRequest} className="auth-page-form"><div className="form-group"><label className="form-label">Requested vehicles</label><input className="form-input" type="number" min="1" required value={requestForm.requested_vehicles} onChange={(event) => setRequestForm({ ...requestForm, requested_vehicles: event.target.value })} /></div><div className="form-group"><label className="form-label">Notes (optional)</label><textarea className="form-input" rows="3" value={requestForm.notes} onChange={(event) => setRequestForm({ ...requestForm, notes: event.target.value })} /></div><div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary">Send request</button></div></form> : <form onSubmit={handleMessage} className="auth-page-form"><div className="form-group"><label className="form-label">Message</label><textarea className="form-input" rows="5" required placeholder="Type your message..." value={messageForm.message} onChange={(event) => setMessageForm({ ...messageForm, message: event.target.value })} /></div><div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary">Send message</button></div></form>}
      </section></div> : null}
    </div>
  );
};
export const PaymentsReview = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPayments = async () => {
    try {
      const response = await fetchSchoolPayments();
      setPayments(response.payments || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { loadPayments(); }, []);

  const handleApprove = async (id) => {
    try {
      await approveSchoolPayment(id);
      await loadPayments();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <h1 className="page-title">Trip Payments</h1>
      <p className="page-subtitle">Review and approve M-Pesa payments made by parents for their students.</p>

      {error && <p className="auth-feedback auth-feedback-error">{error}</p>}

      <div className="card" style={{ padding: 0 }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Trip Type</th>
                <th>Parent Info</th>
                <th>Amount & M-Pesa Ref</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && payments.length === 0 && (
                <tr><td colSpan="6" className="empty-table-cell">No payments found.</td></tr>
              )}
              {payments.map(p => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.student_name}</strong>
                    <div className="page-subtitle" style={{ margin: 0 }}>{p.grade}</div>
                  </td>
                  <td><span style={{ textTransform: 'capitalize' }}>{p.trip_type}</span></td>
                  <td>{p.parent_name}<br/>{p.phone_number}</td>
                  <td>KES {p.amount}<br/><strong style={{ color: 'var(--color-brand)' }}>{p.mpesa_reference || 'N/A'}</strong></td>
                  <td><StatusBadge value={p.status} /></td>
                  <td>
                    {p.status === 'submitted' ? (
                      <button className="btn btn-primary action-btn" onClick={() => handleApprove(p.id)}>Approve</button>
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
export const SchoolComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responses, setResponses] = useState({});
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetchSchoolComplaints();
      setComplaints(response.complaints || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { loadComplaints(); }, []);

  const filteredComplaints = complaints.filter((complaint) => `${complaint.passenger_phone || ''} ${complaint.passenger_email || ''} ${complaint.location || ''} ${complaint.message || ''} ${complaint.status || ''}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filteredComplaints.length / pageSize));
  const visibleComplaints = filteredComplaints.slice(page * pageSize, (page + 1) * pageSize);
  const selectedComplaint = complaints.find((complaint) => String(complaint.id) === String(selectedComplaintId));

  const handleRespond = async (event) => {
    event.preventDefault();
    if (!responses[selectedComplaintId]?.trim()) return;
    try {
      await respondToSchoolComplaint(selectedComplaintId, { response_message: responses[selectedComplaintId].trim() });
      setResponses((current) => ({ ...current, [selectedComplaintId]: '' }));
      setSelectedComplaintId(null);
      setError('');
      await loadComplaints();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <h1 className="page-title">Passenger Complaints</h1>
      <p className="page-subtitle">Review passenger feedback about your school transport service and respond to open complaints.</p>
      {error && !selectedComplaint ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
      <section className="card route-directory-panel">
        <div className="route-directory-toolbar route-directory-toolbar-no-action">
          <span className="route-count">{filteredComplaints.length} {filteredComplaints.length === 1 ? 'complaint' : 'complaints'}</span>
          <div className="route-search-row"><input className="form-input" aria-label="Search complaints" placeholder="Search passenger, location or message" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /><span className="route-search-icon" aria-hidden="true">&#128269;</span></div>
          <div className="route-pagination" aria-label="Complaint pages"><button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>&lsaquo;</button><span>{page + 1} / {pageCount}</span><button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>&rsaquo;</button></div>
        </div>
        <div className="data-table-wrap"><table className="data-table route-directory-table">
          <thead><tr><th>#</th><th>Passenger</th><th>Location</th><th>Complaint</th><th>Submitted</th><th>Status</th><th>Response</th><th>Action</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="8" className="empty-table-cell">Loading complaints...</td></tr>}
            {!loading && visibleComplaints.length === 0 && <tr><td colSpan="8" className="empty-table-cell">{complaints.length ? 'No complaints match your search.' : 'No complaints found for your school.'}</td></tr>}
            {!loading && visibleComplaints.map((complaint, index) => <tr key={complaint.id}><td>{page * pageSize + index + 1}</td><td>{complaint.passenger_phone || complaint.passenger_email || 'Unknown'}</td><td>{complaint.location || '—'}</td><td style={{ minWidth: '250px', whiteSpace: 'normal' }}>{complaint.message}</td><td>{complaint.created_at ? new Date(complaint.created_at).toLocaleString() : '—'}</td><td><StatusBadge value={complaint.status} /></td><td style={{ minWidth: '200px', whiteSpace: 'normal' }}>{complaint.response_message || '—'}</td><td>{complaint.status === 'open' ? <button className="btn btn-primary action-btn" onClick={() => { setError(''); setSelectedComplaintId(complaint.id); }}>Respond</button> : <span className="table-success-text">Sent</span>}</td></tr>)}
          </tbody>
        </table></div>
      </section>

      {selectedComplaint ? <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedComplaintId(null); }}><section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="school-complaint-modal-title">
        <div className="dashboard-modal-heading"><div><h2 id="school-complaint-modal-title">Respond to complaint</h2><p className="page-subtitle">From {selectedComplaint.passenger_phone || selectedComplaint.passenger_email || 'passenger'} | {selectedComplaint.location}</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setSelectedComplaintId(null)}>×</button></div>
        <div className="stack-item" style={{ marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{selectedComplaint.message}</div>
        {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
        <form className="auth-page-form" onSubmit={handleRespond}><div className="form-group"><label className="form-label">Your response</label><textarea className="form-input" rows="4" placeholder="Write a response to the passenger..." value={responses[selectedComplaintId] || ''} onChange={(event) => setResponses((current) => ({ ...current, [selectedComplaintId]: event.target.value }))} required /></div><div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setSelectedComplaintId(null)}>Cancel</button><button type="submit" className="btn btn-primary">Send response</button></div></form>
      </section></div> : null}
    </div>
  );
};
export const PaymentsReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const loadReport = async () => {
    setLoading(true);
    try {
      const query = `?month=${month}&year=${year}`;
      const data = await fetchSchoolPaymentsReport(query);
      setReport(data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const exportToCSV = () => {
    if (!report?.payments) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Parent Name,Student Name,Amount,Status,Date\r\n";

    report.payments.forEach(p => {
      csvContent += `"${p.parent_name}","${p.student_name}",${p.amount},"${p.payment_status}","${p.paid_at}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `School_Payments_${report.period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => { loadReport(); }, [month, year]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title">School Payments Report</h1>
          <p className="page-subtitle">Trip payment details for {report?.school_name} - Period: {report?.period}.</p>
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
      {loading ? <p className="page-subtitle">Loading payment data...</p> : (
        <>
          <div className="card" style={{ marginBottom: '2rem', background: 'var(--color-success)', color: 'white' }}>
            <h3 style={{ opacity: 0.9 }}>Total Payments Collected</h3>
            <h1 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>KES {report?.total_collected?.toLocaleString()}</h1>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-glass)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Parent Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Student Name</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Amount (KES)</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {report?.payments?.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem' }}>{p.parent_name}</td>
                    <td style={{ padding: '1rem' }}>{p.student_name}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{parseFloat(p.amount).toLocaleString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}><StatusBadge value={p.payment_status} /></td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{new Date(p.paid_at).toLocaleDateString()}</td>
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
