import React, { useState, useEffect } from 'react';
import { fetchBookingComplaints, respondToBookingComplaint, fetchBookingManifestReport } from '../../../services/bookingAdminApi';

// === 1. Approve Booking Drivers Component ===
export const ApproveBookingDrivers = () => {
  const [drivers, setDrivers] = useState([
    { id: 1, name: 'Samuel Mwangi', plate: 'KDC 456X', capacity: 45, status: 'pending' },
    { id: 2, name: 'Peter Omondi', plate: 'KDG 112Y', capacity: 33, status: 'approved' }
  ]);

  const handleApprove = (id) => {
    setDrivers(drivers.map(d => d.id === id ? { ...d, status: 'approved' } : d));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Approve Booking Drivers</h1>
          <p className="page-subtitle" style={{ marginBottom: '0' }}>Review and approve drivers who registered under your booking company.</p>
        </div>
        <button className="btn btn-primary" onClick={handlePrint} style={{ width: 'auto', padding: '0.5rem 1.5rem' }}>
          Print / Download List
        </button>
      </div>
      
      <div className="card" style={{ padding: '0', marginTop: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-glass)' }}>
              <th style={{ padding: '1rem' }}>Driver Name</th>
              <th style={{ padding: '1rem' }}>Plates</th>
              <th style={{ padding: '1rem' }}>Bus Capacity</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(driver => (
              <tr key={driver.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem' }}>{driver.name}</td>
                <td style={{ padding: '1rem' }}>{driver.plate}</td>
                <td style={{ padding: '1rem' }}>{driver.capacity} Seats</td>
                <td style={{ padding: '1rem' }}>
                  {driver.status === 'pending' ? (
                    <button className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }} onClick={() => handleApprove(driver.id)}>Approve</button>
                  ) : (
                    <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Approved</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// === 2. Upload Routes Component ===
export const UploadRoutes = () => {
  return (
    <div>
      <h1 className="page-title">Upload Routes & Fares</h1>
      <p className="page-subtitle">Manage routes, terminals, and their associated pricing.</p>
      
      <div className="card" style={{ maxWidth: '600px', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-brand)' }}>Add New Route</h3>
        <div className="form-group">
          <label className="form-label">Departure Terminal</label>
          <input type="text" className="form-input" placeholder="e.g. Nairobi CBD" />
        </div>
        <div className="form-group">
          <label className="form-label">Destination Terminal</label>
          <input type="text" className="form-input" placeholder="e.g. Mombasa" />
        </div>
        <div className="form-group">
          <label className="form-label">Standard Fare (KES)</label>
          <input type="number" className="form-input" placeholder="1500" />
        </div>
        <button className="btn btn-primary">Upload Route</button>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <h3 style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>Active Routes</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-glass)' }}>
              <th style={{ padding: '1rem' }}>Departure</th>
              <th style={{ padding: '1rem' }}>Destination</th>
              <th style={{ padding: '1rem' }}>Fare (KES)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '1rem' }}>Nairobi CBD</td>
              <td style={{ padding: '1rem' }}>Mombasa</td>
              <td style={{ padding: '1rem' }}>1,500</td>
            </tr>
            <tr>
              <td style={{ padding: '1rem' }}>Nairobi CBD</td>
              <td style={{ padding: '1rem' }}>Kisumu</td>
              <td style={{ padding: '1rem' }}>1,200</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// === 3. Bus Availability Component ===
export const BusAvailability = () => {
  return (
    <div>
      <h1 className="page-title">Bus Availability</h1>
      <p className="page-subtitle">Monitor available buses, their assigned drivers, and departure times.</p>
      
      <div className="card-grid">
        <div className="card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Mombasa Express</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Route: Nairobi - Mombasa</p>
          <div style={{ background: 'var(--color-bg-glass)', padding: '1rem', borderRadius: '8px' }}>
            <p><strong>Driver:</strong> Peter Omondi</p>
            <p><strong>Plate:</strong> KDG 112Y</p>
            <p><strong>Departure:</strong> Today, 10:00 PM</p>
            <p style={{ marginTop: '0.5rem', color: 'var(--color-success)', fontWeight: 'bold' }}>Status: Available (12 seats left)</p>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--color-brand)' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Kisumu Shuttle</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Route: Nairobi - Kisumu</p>
          <div style={{ background: 'var(--color-bg-glass)', padding: '1rem', borderRadius: '8px' }}>
            <p><strong>Driver:</strong> Samuel Mwangi</p>
            <p><strong>Plate:</strong> KDC 456X</p>
            <p><strong>Departure:</strong> Tomorrow, 06:00 AM</p>
            <p style={{ marginTop: '0.5rem', color: 'var(--color-brand)', fontWeight: 'bold' }}>Status: Boarding (4 seats left)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// === 4. Passenger List Component ===
export const PassengerList = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Passenger Manifest</h1>
          <p className="page-subtitle" style={{ marginBottom: '0' }}>List of passengers who have booked and paid.</p>
        </div>
        <select className="form-select" style={{ width: 'auto' }}>
          <option>Mombasa Express - Today 10:00 PM</option>
          <option>Kisumu Shuttle - Tomorrow 06:00 AM</option>
        </select>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-glass)' }}>
              <th style={{ padding: '1rem' }}>Seat #</th>
              <th style={{ padding: '1rem' }}>Passenger Name</th>
              <th style={{ padding: '1rem' }}>Contact</th>
              <th style={{ padding: '1rem' }}>Payment Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--color-brand)' }}>01</td>
              <td style={{ padding: '1rem' }}>Alice Wanjiku</td>
              <td style={{ padding: '1rem' }}>+254 711 000001</td>
              <td style={{ padding: '1rem' }}><span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Paid</span></td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--color-brand)' }}>02</td>
              <td style={{ padding: '1rem' }}>Brian Kiprotich</td>
              <td style={{ padding: '1rem' }}>+254 722 000002</td>
              <td style={{ padding: '1rem' }}><span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Paid</span></td>
            </tr>
          </tbody>
        </table>
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

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetchBookingComplaints();
      setComplaints(res.complaints || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { loadComplaints(); }, []);

  const handleRespond = async (id) => {
    if (!responses[id]) return;
    try {
      await respondToBookingComplaint(id, { response_message: responses[id] });
      setResponses({ ...responses, [id]: '' });
      await loadComplaints();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <h1 className="page-title">Booking Complaints</h1>
      <p className="page-subtitle">View and address feedback directed towards your booking company.</p>
      
      {error && <p className="auth-feedback auth-feedback-error">{error}</p>}

      <div className="card-grid">
        {!loading && complaints.length === 0 && (
          <div className="card text-center" style={{ gridColumn: '1 / -1' }}>
            <p className="page-subtitle">No complaints found for your company.</p>
          </div>
        )}

        {complaints.map(c => (
          <div key={c.id} className="card" style={{ borderTop: c.status === 'open' ? '4px solid #ef4444' : '4px solid var(--color-success)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h4 style={{ color: c.status === 'open' ? '#ef4444' : 'var(--color-success)' }}>Passenger: {c.passenger_phone || c.passenger_email}</h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <p><strong>Route:</strong> {c.route_name}</p>
            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
              {c.message}
            </div>
            
            {c.status === 'open' ? (
              <>
                <textarea 
                  className="form-input" 
                  style={{ marginTop: '1rem', height: '80px' }} 
                  placeholder="Type your resolution..."
                  value={responses[c.id] || ''}
                  onChange={(e) => setResponses({ ...responses, [c.id]: e.target.value })}
                ></textarea>
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => handleRespond(c.id)}
                  disabled={!responses[c.id]}
                >
                  Send Resolution
                </button>
              </>
            ) : (
              <div style={{ marginTop: '1rem', color: 'var(--color-success)' }}>
                <strong>Resolution:</strong>
                <p>{c.response_message}</p>
              </div>
            )}
          </div>
        ))}
      </div>
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
