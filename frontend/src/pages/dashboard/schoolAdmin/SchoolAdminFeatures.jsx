import React, { useEffect, useState } from 'react';
import {
  approveSchoolDriver,
  assignClosingTripStudents,
  assignDailyTripStudents,
  createClosingTrip,
  createDailyTrip,
  createEducationalTrip,
  createSchoolRoute,
  createSchoolSaccoRequest,
  fetchClosingAssignments,
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
          {activeTab === 'daily' && <DailyTrips data={data} reloadData={loadData} setError={setError} />}
          {activeTab === 'educational' && <EducationalTrips data={data} reloadData={loadData} setError={setError} />}
          {activeTab === 'closing' && <ClosingTrips data={data} reloadData={loadData} setError={setError} />}
        </>
      )}
    </div>
  );
};

const DailyTrips = ({ data, reloadData, setError }) => {
  const [routeForm, setRouteForm] = useState({ route_name: '', terminals: [''] });
  const [tripForm, setTripForm] = useState({ school_route_id: '', grade: '', pickup_time: '', dropoff_time: '', amount: '' });
  const [assignmentForm, setAssignmentForm] = useState({}); // { tripId: { school_driver_id: '', assigned_pickup_time: '', parent_ids: [] } }

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      await createSchoolRoute({ ...routeForm, terminals: routeForm.terminals.filter(Boolean) });
      setRouteForm({ route_name: '', terminals: [''] });
      await reloadData();
    } catch (err) { setError(err.message); }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      await createDailyTrip({ ...tripForm, school_route_id: Number(tripForm.school_route_id), amount: Number(tripForm.amount) });
      setTripForm({ school_route_id: '', grade: '', pickup_time: '', dropoff_time: '', amount: '' });
      await reloadData();
    } catch (err) { setError(err.message); }
  };

  const handleAssignStudents = async (tripId) => {
    const form = assignmentForm[tripId];
    if (!form || !form.school_driver_id || !form.assigned_pickup_time || !form.parent_ids || form.parent_ids.length === 0) {
      setError("Please select a driver, pickup time, and at least one student.");
      return;
    }
    try {
      await assignDailyTripStudents(tripId, {
        school_driver_id: Number(form.school_driver_id),
        assigned_pickup_time: form.assigned_pickup_time,
        parent_ids: form.parent_ids.map(Number)
      });
      await reloadData();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="role-middle-grid">
      <div className="stack-list">
        <article className="card">
          <h3>Create Route</h3>
          <form onSubmit={handleCreateRoute} className="auth-page-form" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Route Name</label>
              <input className="form-input" required value={routeForm.route_name} onChange={e => setRouteForm({...routeForm, route_name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Terminals</label>
              <div className="stack-list">
                {routeForm.terminals.map((t, i) => (
                  <input key={i} className="form-input" required placeholder={`Terminal ${i+1}`} value={t} onChange={e => {
                    const newT = [...routeForm.terminals]; newT[i] = e.target.value; setRouteForm({...routeForm, terminals: newT});
                  }} />
                ))}
                <button type="button" className="btn btn-outline" onClick={() => setRouteForm({...routeForm, terminals: [...routeForm.terminals, '']})}>Add Terminal</button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Save Route</button>
          </form>
        </article>

        <article className="card">
          <h3>Publish Daily Trip</h3>
          <form onSubmit={handleCreateTrip} className="auth-page-form" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Select Route</label>
              <select className="form-select" required value={tripForm.school_route_id} onChange={e => setTripForm({...tripForm, school_route_id: e.target.value})}>
                <option value="">Choose...</option>
                {data.routes.map(r => <option key={r.id} value={r.id}>{r.route_name}</option>)}
              </select>
            </div>
            <div className="auth-grid auth-grid-two">
              <div className="form-group">
                <label className="form-label">Grade</label>
                <input className="form-input" required placeholder="e.g. Grade 1" value={tripForm.grade} onChange={e => setTripForm({...tripForm, grade: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (KES)</label>
                <input className="form-input" type="number" required value={tripForm.amount} onChange={e => setTripForm({...tripForm, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Base Pickup Time</label>
                <input className="form-input" type="time" required value={tripForm.pickup_time} onChange={e => setTripForm({...tripForm, pickup_time: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Base Dropoff Time</label>
                <input className="form-input" type="time" required value={tripForm.dropoff_time} onChange={e => setTripForm({...tripForm, dropoff_time: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Publish Trip</button>
          </form>
        </article>
      </div>

      <div className="stack-list">
        <h3>Published Daily Trips</h3>
        {data.daily_trips.length === 0 && <p className="page-subtitle">No daily trips published.</p>}
        {data.daily_trips.map(trip => {
          const eligibleStudents = data.students.filter(s => s.grade === trip.grade);
          return (
            <div key={trip.id} className="card">
              <div className="info-topline">
                <h4>{trip.route_name} ({trip.grade})</h4>
                <StatusBadge value={trip.status} />
              </div>
              <p>Pickup: {trip.pickup_time} | Dropoff: {trip.dropoff_time} | KES {trip.amount}</p>
              <p className="page-subtitle">Assigned: {trip.assigned_students} | Approved Payments: {trip.approved_payments}</p>

              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <h5 style={{ marginBottom: '10px' }}>Compile List & Assign Driver</h5>
                <div className="auth-grid auth-grid-two">
                  <select className="form-select" value={assignmentForm[trip.id]?.school_driver_id || ''} onChange={e => setAssignmentForm({...assignmentForm, [trip.id]: {...(assignmentForm[trip.id] || {}), school_driver_id: e.target.value}})}>
                    <option value="">Select Driver...</option>
                    {data.school_drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <input className="form-input" type="time" placeholder="Specific Pickup Time" value={assignmentForm[trip.id]?.assigned_pickup_time || ''} onChange={e => setAssignmentForm({...assignmentForm, [trip.id]: {...(assignmentForm[trip.id] || {}), assigned_pickup_time: e.target.value}})} />
                </div>
                
                <div className="stack-list" style={{ marginTop: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                  {eligibleStudents.length === 0 && <span style={{fontSize:'0.8rem', color: 'var(--color-text-muted)'}}>No eligible students found. Parents need to pay first.</span>}
                  {eligibleStudents.map(student => (
                    <label key={student.id} className="checkbox-row" style={{fontSize: '0.85rem'}}>
                      <input type="checkbox" 
                        checked={(assignmentForm[trip.id]?.parent_ids || []).includes(student.id)}
                        onChange={(e) => {
                          const currentIds = assignmentForm[trip.id]?.parent_ids || [];
                          const newIds = e.target.checked ? [...currentIds, student.id] : currentIds.filter(id => id !== student.id);
                          setAssignmentForm({...assignmentForm, [trip.id]: {...(assignmentForm[trip.id] || {}), parent_ids: newIds}});
                        }} 
                      />
                      {student.student_name} (Parent: {student.parent_name})
                    </label>
                  ))}
                </div>
                <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => handleAssignStudents(trip.id)}>Compile & Send to Driver</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EducationalTrips = ({ data, reloadData, setError }) => {
  const [form, setForm] = useState({ trip_title: '', destination: '', duration_days: '', grade: '', amount: '', trip_date: '', notes: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEducationalTrip({ ...form, duration_days: Number(form.duration_days), amount: Number(form.amount) });
      setForm({ trip_title: '', destination: '', duration_days: '', grade: '', amount: '', trip_date: '', notes: '' });
      await reloadData();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="role-middle-grid">
      <article className="card">
        <h3>Post Educational Trip</h3>
        <form onSubmit={handleSubmit} className="auth-page-form" style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Trip Title</label>
            <input className="form-input" required value={form.trip_title} onChange={e => setForm({...form, trip_title: e.target.value})} />
          </div>
          <div className="auth-grid auth-grid-two">
            <div className="form-group">
              <label className="form-label">Destination</label>
              <input className="form-input" required value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Target Grade</label>
              <input className="form-input" required placeholder="e.g. Grade 4" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (Days)</label>
              <input className="form-input" type="number" required value={form.duration_days} onChange={e => setForm({...form, duration_days: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Cost (KES)</label>
              <input className="form-input" type="number" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Date (Optional)</label>
            <input className="form-input" type="date" value={form.trip_date} onChange={e => setForm({...form, trip_date: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary">Publish Educational Trip</button>
        </form>
      </article>

      <div className="stack-list">
        <h3>Published Educational Trips</h3>
        {data.educational_trips.length === 0 && <p className="page-subtitle">No educational trips published.</p>}
        {data.educational_trips.map(trip => (
          <div key={trip.id} className="card">
            <div className="info-topline">
              <h4>{trip.trip_title}</h4>
              <StatusBadge value={trip.status} />
            </div>
            <p><strong>Grade:</strong> {trip.grade} | <strong>Dest:</strong> {trip.destination}</p>
            <p><strong>Cost:</strong> KES {trip.amount} | <strong>Duration:</strong> {trip.duration_days} days</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ClosingTrips = ({ data, reloadData, setError }) => {
  const [form, setForm] = useState({ closing_day: '', preferred_sacco_admin_id: '', notes: '' });
  const [fareForms, setFareForms] = useState({}); // {tripId: {sacco_route_id, from_terminal_id, to_terminal_id, amount}}
  const [assignForms, setAssignForms] = useState({}); // {tripId: [{parent_id, sacco_driver_id, school_closing_trip_fare_id}]}

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createClosingTrip({ ...form, preferred_sacco_admin_id: form.preferred_sacco_admin_id ? Number(form.preferred_sacco_admin_id) : null });
      setForm({ closing_day: '', preferred_sacco_admin_id: '', notes: '' });
      await reloadData();
    } catch (err) { setError(err.message); }
  };

  const handleSaveFare = async (tripId) => {
    const fForm = fareForms[tripId];
    if (!fForm || !fForm.sacco_route_id || !fForm.from_terminal_id || !fForm.to_terminal_id || !fForm.amount) {
      setError("Please fill all fare fields."); return;
    }
    try {
      await saveClosingTripFare(tripId, { ...fForm, sacco_route_id: Number(fForm.sacco_route_id), from_terminal_id: Number(fForm.from_terminal_id), to_terminal_id: Number(fForm.to_terminal_id), amount: Number(fForm.amount) });
      await reloadData();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="role-middle-grid">
      <article className="card">
        <h3>Schedule Closing Day Trip</h3>
        <form onSubmit={handleCreate} className="auth-page-form" style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Closing Date</label>
            <input className="form-input" type="date" required value={form.closing_day} onChange={e => setForm({...form, closing_day: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Preferred Sacco Partner</label>
            <select className="form-select" value={form.preferred_sacco_admin_id} onChange={e => setForm({...form, preferred_sacco_admin_id: e.target.value})}>
              <option value="">Select Sacco...</option>
              {data.sacco_admins.map(s => <option key={s.id} value={s.id}>{s.sacco_name} ({s.name})</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Schedule Closing Trip</button>
        </form>
      </article>

      <div className="stack-list">
        <h3>Scheduled Closing Trips</h3>
        {data.closing_trips.length === 0 && <p className="page-subtitle">No closing trips scheduled.</p>}
        {data.closing_trips.map(trip => {
          const preferredSacco = data.sacco_admins.find(s => s.id === trip.preferred_sacco_admin_id);
          const saccoRoutes = preferredSacco ? preferredSacco.routes : [];
          const selectedRouteForFare = saccoRoutes.find(r => r.id === Number(fareForms[trip.id]?.sacco_route_id));

          return (
            <div key={trip.id} className="card">
              <div className="info-topline">
                <h4>Closing Day: {trip.closing_day}</h4>
                <StatusBadge value={trip.status} />
              </div>
              <p className="page-subtitle">Sacco: {trip.sacco_name || 'None selected'}</p>

              <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '1rem', paddingTop: '1rem' }}>
                <h5>Add Route Fares</h5>
                <div className="auth-grid auth-grid-two" style={{ marginTop: '0.5rem' }}>
                  <select className="form-select" value={fareForms[trip.id]?.sacco_route_id || ''} onChange={e => setFareForms({...fareForms, [trip.id]: {...(fareForms[trip.id]||{}), sacco_route_id: e.target.value}})}>
                    <option value="">Select Route...</option>
                    {saccoRoutes.map(r => <option key={r.id} value={r.id}>{r.route_name}</option>)}
                  </select>
                  <input className="form-input" type="number" placeholder="Cost (KES)" value={fareForms[trip.id]?.amount || ''} onChange={e => setFareForms({...fareForms, [trip.id]: {...(fareForms[trip.id]||{}), amount: e.target.value}})} />
                  <select className="form-select" value={fareForms[trip.id]?.from_terminal_id || ''} onChange={e => setFareForms({...fareForms, [trip.id]: {...(fareForms[trip.id]||{}), from_terminal_id: e.target.value}})}>
                    <option value="">From Terminal...</option>
                    {selectedRouteForFare?.terminals.map(t => <option key={t.id} value={t.id}>{t.terminal_name}</option>)}
                  </select>
                  <select className="form-select" value={fareForms[trip.id]?.to_terminal_id || ''} onChange={e => setFareForms({...fareForms, [trip.id]: {...(fareForms[trip.id]||{}), to_terminal_id: e.target.value}})}>
                    <option value="">To Terminal...</option>
                    {selectedRouteForFare?.terminals.map(t => <option key={t.id} value={t.id}>{t.terminal_name}</option>)}
                  </select>
                </div>
                <button className="btn btn-outline" style={{ marginTop: '10px' }} onClick={() => handleSaveFare(trip.id)}>Save Fare</button>
                
                <div className="stack-list" style={{ marginTop: '10px' }}>
                  {trip.fares.map(f => (
                    <div key={f.id} className="stack-item" style={{ fontSize: '0.85rem' }}>
                      {f.route_name}: {f.from_terminal_name} &rarr; {f.to_terminal_name} (KES {f.amount})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SaccoComm = () => {
  const [query, setQuery] = useState('');
  const [saccos, setSaccos] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [requestForm, setRequestForm] = useState({ requested_vehicles: 1, notes: '' });
  const [messageForm, setMessageForm] = useState({ message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const search = async () => {
      setLoading(true);
      try {
        const res = await fetchSaccoDirectory(query);
        setSaccos(res.saccos || []);
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    const timer = setTimeout(() => { search(); }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    try {
      await createSchoolSaccoRequest({ preferred_sacco_admin_id: selectedAdmin.id, requested_vehicles: Number(requestForm.requested_vehicles), notes: requestForm.notes });
      setSuccess("Vehicle request sent successfully!");
      setRequestForm({ requested_vehicles: 1, notes: '' });
    } catch (err) { setError(err.message); }
  };

  const handleMessage = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    try {
      await sendSchoolSaccoMessage({ sacco_admin_id: selectedAdmin.id, message: messageForm.message });
      setSuccess("Message sent successfully!");
      setMessageForm({ message: '' });
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <h1 className="page-title">Sacco Communication Directory</h1>
      <p className="page-subtitle">Search for approved Saccos and communicate directly with their admins.</p>

      {error && <p className="auth-feedback auth-feedback-error">{error}</p>}
      {success && <p className="auth-feedback table-success-text">{success}</p>}

      <div className="role-middle-grid">
        <article className="card">
          <div className="form-group">
            <label className="form-label">Search Saccos</label>
            <input className="form-input" placeholder="Search by name, route, or location..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>

          <div className="stack-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {!loading && saccos.length === 0 && <p className="page-subtitle">No saccos found.</p>}
            {saccos.map(sacco => (
              <div key={sacco.sacco_name} className="stack-item">
                <h4 style={{ marginBottom: '8px', color: 'var(--color-brand)' }}>{sacco.sacco_name}</h4>
                <div className="stack-list">
                  {sacco.admins.map(admin => (
                    <div key={admin.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      <div>
                        <strong>{admin.name}</strong>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{admin.route_name} | {admin.location}</p>
                      </div>
                      <button className="btn btn-outline" style={{ width: 'auto', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={() => { setSelectedAdmin(admin); setSuccess(''); setError(''); }}>Select</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        {selectedAdmin ? (
          <div className="stack-list">
            <article className="card">
              <h3>Send Vehicle Request</h3>
              <p className="page-subtitle">To: {selectedAdmin.sacco_name} ({selectedAdmin.name})</p>
              <form onSubmit={handleRequest} className="auth-page-form">
                <div className="form-group">
                  <label className="form-label">Requested Vehicles</label>
                  <input className="form-input" type="number" min="1" required value={requestForm.requested_vehicles} onChange={e => setRequestForm({...requestForm, requested_vehicles: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" rows="2" value={requestForm.notes} onChange={e => setRequestForm({...requestForm, notes: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary">Send Request</button>
              </form>
            </article>
            
            <article className="card">
              <h3>Direct Message</h3>
              <form onSubmit={handleMessage} className="auth-page-form">
                <div className="form-group">
                  <textarea className="form-input" rows="3" required placeholder="Type your message..." value={messageForm.message} onChange={e => setMessageForm({...messageForm, message: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-outline">Send Message</button>
              </form>
            </article>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
            <p className="page-subtitle">Select a Sacco Admin from the directory to communicate.</p>
          </div>
        )}
      </div>
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
  const [responses, setResponses] = useState({}); // {complaintId: message}

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetchSchoolComplaints();
      setComplaints(res.complaints || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { loadComplaints(); }, []);

  const handleRespond = async (id) => {
    if (!responses[id]) return;
    try {
      await respondToSchoolComplaint(id, { response_message: responses[id] });
      setResponses({ ...responses, [id]: '' });
      await loadComplaints();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <h1 className="page-title">Passenger Complaints</h1>
      <p className="page-subtitle">Personalized feedback from passengers regarding your school transport service.</p>

      {error && <p className="auth-feedback auth-feedback-error">{error}</p>}

      <div className="stack-list">
        {!loading && complaints.length === 0 && (
          <div className="card text-center">
            <p className="page-subtitle">No complaints found for your school.</p>
          </div>
        )}

        {complaints.map(c => (
          <div key={c.id} className="card" style={{ borderLeft: c.status === 'open' ? '4px solid #ef4444' : '4px solid var(--color-success)' }}>
            <div className="info-topline">
              <strong>{c.passenger_phone || c.passenger_email}</strong>
              <StatusBadge value={c.status} />
            </div>
            <p className="page-subtitle" style={{ marginBottom: '1rem' }}>Location: {c.location} | Submitted: {new Date(c.created_at).toLocaleString()}</p>
            <p style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>{c.message}</p>
            
            {c.status === 'open' ? (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <label className="form-label">Send personalized response</label>
                <textarea 
                  className="form-input" 
                  rows="2" 
                  placeholder="e.g. We have received your complaint and are looking into it..."
                  value={responses[c.id] || ''}
                  onChange={(e) => setResponses({ ...responses, [c.id]: e.target.value })}
                ></textarea>
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '0.5rem', width: 'auto' }}
                  onClick={() => handleRespond(c.id)}
                  disabled={!responses[c.id]}
                >
                  Send Response
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '1rem', color: 'var(--color-success)' }}>
                <strong>Your Response:</strong>
                <p>{c.response_message}</p>
                <small style={{ color: 'var(--color-text-muted)' }}>Responded at: {new Date(c.responded_at).toLocaleString()}</small>
              </div>
            )}
          </div>
        ))}
      </div>
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
