import React, { useState, useEffect } from 'react';
import { fetchBookingComplaints, respondToBookingComplaint, fetchBookingManifestReport, fetchBookingRoutes, createBookingRoute, fetchBookingDrivers, approveBookingDriver } from '../../../services/bookingAdminApi';

// === 1. Approve Booking Drivers Component ===
export const ApproveBookingDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [approvingDriverId, setApprovingDriverId] = useState(null);
  const pageSize = 10;

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const response = await fetchBookingDrivers();
      setDrivers(response.drivers || []);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Could not load booking drivers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDrivers(); }, []);

  const filteredDrivers = drivers.filter((driver) => `${driver.name || ''} ${driver.phone || ''} ${driver.email || ''} ${driver.number_plate || ''} ${driver.company_name || ''} ${driver.status || ''}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filteredDrivers.length / pageSize));
  const visibleDrivers = filteredDrivers.slice(page * pageSize, (page + 1) * pageSize);

  const handleApprove = async (driverId) => {
    setApprovingDriverId(driverId);
    setError('');
    try {
      await approveBookingDriver(driverId);
      await loadDrivers();
    } catch (requestError) {
      setError(requestError.message || 'Could not approve this driver.');
    } finally {
      setApprovingDriverId(null);
    }
  };

  return (
    <div>
      <h1 className="page-title">Approve Booking Drivers</h1>
      <p className="page-subtitle">Review drivers registered with the same booking service name as your account.</p>
      {error && <p role="alert" className="auth-feedback auth-feedback-error">{error}</p>}
      <section className="card route-directory-panel">
        <div className="route-directory-toolbar route-directory-toolbar-no-action">
          <span className="route-count">{filteredDrivers.length} {filteredDrivers.length === 1 ? 'driver' : 'drivers'}</span>
          <div className="route-search-row"><input className="form-input" aria-label="Search booking drivers" placeholder="Search name, plate or contact" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /><span className="route-search-icon" aria-hidden="true">&#128269;</span></div>
          <div className="route-pagination" aria-label="Driver pages"><button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>&lsaquo;</button><span>{page + 1} / {pageCount}</span><button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>&rsaquo;</button></div>
        </div>
        <div className="data-table-wrap"><table className="data-table route-directory-table">
          <thead><tr><th>#</th><th>Driver</th><th>Phone</th><th>Email</th><th>Number plate</th><th>Bus capacity</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="8" className="empty-table-cell">Loading drivers from the backend...</td></tr>}
            {!loading && visibleDrivers.length === 0 && <tr><td colSpan="8" className="empty-table-cell">{drivers.length ? 'No drivers match your search.' : 'No drivers registered under your booking company yet.'}</td></tr>}
            {!loading && visibleDrivers.map((driver, index) => <tr key={driver.id}>
              <td>{page * pageSize + index + 1}</td><td><strong>{driver.name}</strong></td><td>{driver.phone || '-'}</td><td>{driver.email || '-'}</td><td>{driver.number_plate || '-'}</td><td>{driver.bus_capacity ?? '-'}</td>
              <td><span className={`role-chip ${driver.status === 'pending_approval' ? 'passive' : ''}`}>{driver.status === 'pending_approval' ? 'Pending approval' : driver.status}</span></td>
              <td>{driver.status === 'pending_approval' ? <button type="button" className="btn btn-primary action-btn" disabled={approvingDriverId === driver.id} onClick={() => handleApprove(driver.id)}>{approvingDriverId === driver.id ? 'Approving...' : 'Approve'}</button> : <span className="table-success-text">Approved</span>}</td>
            </tr>)}
          </tbody>
        </table></div>
      </section>
    </div>
  );
};

// === 2. Upload Routes Component ===
export const UploadRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', departure: '', destination: '', fare: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const response = await fetchBookingRoutes();
      setRoutes(response.routes || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load routes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoutes(); }, []);

  const submitRoute = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await createBookingRoute({ ...form, fare: Number(form.fare) });
      setRoutes((current) => [response.route, ...current]);
      setPage(0);
      setForm({ name: '', departure: '', destination: '', fare: '' });
      setModalOpen(false);
    } catch (err) {
      setError(err.message || 'Could not register this route.');
    } finally {
      setSaving(false);
    }
  };

  const routeRows = routes.map((route) => {
    const terminals = (route.terminals || [])
      .map((terminal) => typeof terminal === 'string' ? terminal : (terminal.terminal_name || terminal.name))
      .filter(Boolean);

    return {
      ...route,
      displayName: route.route_name || route.name || 'Unnamed route',
      departure: route.departure || terminals[0] || '-',
      destination: route.destination || terminals[terminals.length - 1] || '-',
      terminals,
    };
  });
  const filteredRoutes = routeRows.filter((route) => `${route.displayName} ${route.location || ''} ${route.departure} ${route.destination} ${route.terminals.join(' ')} ${route.fare ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filteredRoutes.length / pageSize));
  const visibleRoutes = filteredRoutes.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div>
      <h1 className="page-title">Routes and Terminals</h1>
      <p className="page-subtitle">Register booking service routes with their departure, destination and fare. These records are separate from SACCO and school routes.</p>
      <section className="card route-directory-panel">
        <div className="route-directory-toolbar">
          <button type="button" className="btn btn-outline route-register-button" onClick={() => { setError(''); setModalOpen(true); }}>Register route</button>
          <span className="route-count">{filteredRoutes.length} {filteredRoutes.length === 1 ? 'route' : 'routes'}</span>
          <div className="route-search-row">
            <input className="form-input" aria-label="Search booking routes" placeholder="Search route, departure or destination" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} />
            <span className="route-search-icon" aria-hidden="true">&#128269;</span>
          </div>
          <div className="route-pagination" aria-label="Route pages">
            <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>&lsaquo;</button>
            <span>{page + 1} / {pageCount}</span>
            <button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>&rsaquo;</button>
          </div>
        </div>
        {error && !modalOpen && <p role="alert" className="auth-feedback auth-feedback-error" style={{ margin: '0 22px 14px' }}>{error}</p>}
        <div className="data-table-wrap">
          <table className="data-table route-directory-table">
          <thead><tr><th>#</th><th>Route</th><th>Departure</th><th>Destination</th><th>Fare (KES)</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="empty-table-cell">Loading routes...</td></tr> : visibleRoutes.length ? visibleRoutes.map((route, index) => <tr key={route.id}><td>{page * pageSize + index + 1}</td><td><strong>{route.displayName}</strong></td><td>{route.departure}</td><td>{route.destination}</td><td>{route.fare === undefined || route.fare === null ? 'Not set' : Number(route.fare).toLocaleString()}</td></tr>) : <tr><td colSpan="5" className="empty-table-cell">{routes.length ? 'No routes match your search.' : 'No routes have been registered yet.'}</td></tr>}
          </tbody>
          </table>
        </div>
      </section>
      {modalOpen && <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModalOpen(false); }}>
        <section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="booking-route-modal-title">
          <div className="dashboard-modal-heading"><div><h2 id="booking-route-modal-title">Register booking route</h2><p className="page-subtitle">Enter the booking route details and passenger fare.</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setModalOpen(false)} disabled={saving}>&times;</button></div>
          {error && <p role="alert" className="page-subtitle" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <form className="auth-page-form" onSubmit={submitRoute}>
            <div className="form-group"><label className="form-label" htmlFor="booking-route-name">Route name</label><input id="booking-route-name" className="form-input" maxLength="255" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div className="auth-grid auth-grid-two">
              <div className="form-group"><label className="form-label" htmlFor="booking-route-departure">Departure terminal</label><input id="booking-route-departure" className="form-input" maxLength="255" required value={form.departure} onChange={(event) => setForm({ ...form, departure: event.target.value })} /></div>
              <div className="form-group"><label className="form-label" htmlFor="booking-route-destination">Destination terminal</label><input id="booking-route-destination" className="form-input" maxLength="255" required value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label" htmlFor="booking-route-fare">Fare (KES)</label><input id="booking-route-fare" className="form-input" type="number" min="0" step="0.01" required value={form.fare} onChange={(event) => setForm({ ...form, fare: event.target.value })} /></div>
            <div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save booking route'}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
};
export const BusAvailability = () => (
  <div>
    <h1 className="page-title">Bus Availability</h1>
    <p className="page-subtitle">Bus schedules and seat availability will appear here when the booking backend provides persisted availability data.</p>
    <section className="card route-directory-panel">
      <div className="data-table-wrap"><table className="data-table route-directory-table">
        <thead><tr><th>#</th><th>Route</th><th>Departure point</th><th>Driver</th><th>Departure time</th><th>Seats available</th></tr></thead>
        <tbody><tr><td colSpan="6" className="empty-table-cell">No persisted bus availability records are available.</td></tr></tbody>
      </table></div>
    </section>
  </div>
);
export const PassengerList = () => {
  return (
    <div>
      <h1 className="page-title">Passenger Manifest</h1>
      <p className="page-subtitle">Passenger manifest data will appear here when the booking backend exposes it to administrators.</p>
      <div className="card text-center" style={{ marginTop: '1.5rem' }}>
        <p className="page-subtitle">No passenger manifest data is currently available from the backend.</p>
      </div>
    </div>
  );
};

// === 5. Booking Complaints Component ===
export const BookingComplaints = () => {
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
      const response = await fetchBookingComplaints();
      setComplaints(response.complaints || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { loadComplaints(); }, []);

  const filteredComplaints = complaints.filter((complaint) => `${complaint.passenger_phone || ''} ${complaint.passenger_email || ''} ${complaint.route_name || ''} ${complaint.message || ''} ${complaint.status || ''}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filteredComplaints.length / pageSize));
  const visibleComplaints = filteredComplaints.slice(page * pageSize, (page + 1) * pageSize);
  const selectedComplaint = complaints.find((complaint) => String(complaint.id) === String(selectedComplaintId));

  const handleRespond = async (event) => {
    event.preventDefault();
    const responseMessage = responses[selectedComplaintId]?.trim();
    if (!responseMessage) return;
    try {
      await respondToBookingComplaint(selectedComplaintId, { response_message: responseMessage });
      setResponses((current) => ({ ...current, [selectedComplaintId]: '' }));
      setSelectedComplaintId(null);
      setError('');
      await loadComplaints();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <h1 className="page-title">Booking Complaints</h1>
      <p className="page-subtitle">Review and respond to feedback directed to your booking company.</p>
      {error && !selectedComplaint ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
      <section className="card route-directory-panel">
        <div className="route-directory-toolbar route-directory-toolbar-no-action">
          <span className="route-count">{filteredComplaints.length} {filteredComplaints.length === 1 ? 'complaint' : 'complaints'}</span>
          <div className="route-search-row"><input className="form-input" aria-label="Search booking complaints" placeholder="Search passenger, route or message" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /><span className="route-search-icon" aria-hidden="true">&#128269;</span></div>
          <div className="route-pagination" aria-label="Complaint pages"><button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>&lsaquo;</button><span>{page + 1} / {pageCount}</span><button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>&rsaquo;</button></div>
        </div>
        <div className="data-table-wrap"><table className="data-table route-directory-table">
          <thead><tr><th>#</th><th>Passenger</th><th>Route</th><th>Complaint</th><th>Submitted</th><th>Status</th><th>Response</th><th>Action</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="8" className="empty-table-cell">Loading complaints...</td></tr>}
            {!loading && visibleComplaints.length === 0 && <tr><td colSpan="8" className="empty-table-cell">{complaints.length ? 'No complaints match your search.' : 'No complaints found for your company.'}</td></tr>}
            {!loading && visibleComplaints.map((complaint, index) => <tr key={complaint.id}><td>{page * pageSize + index + 1}</td><td>{complaint.passenger_phone || complaint.passenger_email || 'Unknown'}</td><td>{complaint.route_name || '—'}</td><td style={{ minWidth: '240px', whiteSpace: 'normal' }}>{complaint.message}</td><td>{complaint.created_at ? new Date(complaint.created_at).toLocaleString() : '—'}</td><td><span className={`role-chip ${complaint.status === 'open' ? 'passive' : ''}`}>{complaint.status}</span></td><td style={{ minWidth: '200px', whiteSpace: 'normal' }}>{complaint.response_message || '—'}</td><td>{complaint.status === 'open' ? <button className="btn btn-primary action-btn" onClick={() => { setError(''); setSelectedComplaintId(complaint.id); }}>Respond</button> : <span className="table-success-text">Resolved</span>}</td></tr>)}
          </tbody>
        </table></div>
      </section>
      {selectedComplaint ? <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedComplaintId(null); }}><section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="booking-complaint-modal-title">
        <div className="dashboard-modal-heading"><div><h2 id="booking-complaint-modal-title">Respond to complaint</h2><p className="page-subtitle">Passenger: {selectedComplaint.passenger_phone || selectedComplaint.passenger_email} | Route: {selectedComplaint.route_name}</p></div><button type="button" className="dashboard-modal-close" aria-label="Close" onClick={() => setSelectedComplaintId(null)}>×</button></div>
        <div className="stack-item" style={{ marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{selectedComplaint.message}</div>
        {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
        <form className="auth-page-form" onSubmit={handleRespond}><div className="form-group"><label className="form-label">Resolution</label><textarea className="form-input" rows="4" placeholder="Write your resolution..." value={responses[selectedComplaintId] || ''} onChange={(event) => setResponses((current) => ({ ...current, [selectedComplaintId]: event.target.value }))} required /></div><div className="dashboard-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setSelectedComplaintId(null)}>Cancel</button><button type="submit" className="btn btn-primary">Send resolution</button></div></form>
      </section></div> : null}
    </div>
  );
};
export const ManifestReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const loadReport = async () => {
    setLoading(true);
    try {
      const query = `?month=${month}&year=${year}`;
      const data = await fetchBookingManifestReport(query);
      setReport(data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const exportToCSV = () => {
    if (!report?.manifest) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Route,Time,Driver,Passenger Name,Contact,Seat\r\n";

    report.manifest.forEach(m => {
      m.passengers.forEach(p => {
        csvContent += `"${m.route}","${m.time}","${m.driver}","${p.name}","${p.phone}","${p.seat}"\r\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Passenger_Manifest_${report.period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => { loadReport(); }, [month, year]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title">Passenger Manifest Report</h1>
          <p className="page-subtitle">Trip manifest for {report?.company_name} - Period: {report?.period}.</p>
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
          <button className="btn btn-primary" onClick={() => window.print()} style={{ width: 'auto' }}>Print Manifest</button>
        </div>
      </div>

      {error && <p className="auth-feedback auth-feedback-error">{error}</p>}
      {loading ? <p className="page-subtitle">Loading manifest data...</p> : (
        <div className="stack-list">
          {report?.manifest?.map((m, i) => (
            <div key={i} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <h3>{m.route}</h3>
                <span style={{ fontWeight: 'bold', color: 'var(--color-brand)' }}>{m.time}</span>
              </div>
              <p style={{ marginBottom: '1rem' }}><strong>Driver:</strong> {m.driver}</p>
              
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-glass)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Passenger Name</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Contact</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Seat</th>
                  </tr>
                </thead>
                <tbody>
                  {m.passengers.map((p, j) => (
                    <tr key={j} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.5rem' }}>{p.name}</td>
                      <td style={{ padding: '0.5rem' }}>{p.phone}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.seat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
