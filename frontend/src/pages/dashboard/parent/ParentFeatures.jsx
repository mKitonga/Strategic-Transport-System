import React, { useEffect, useState } from 'react';
import {
  fetchParentChild,
  fetchParentTrips,
  makeParentPayment,
  fetchParentNotifications
} from '../../../services/parentApi';

export const RegisterChild = () => {
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChild = async () => {
      try {
        const res = await fetchParentChild();
        setChild(res.child);
      } catch (err) { } finally { setLoading(false); }
    };
    loadChild();
  }, []);

  return (
    <div>
      <h1 className="page-title">My Registered Child</h1>
      <p className="page-subtitle">Your student's details as registered in the system.</p>
      
      <div className="card" style={{ maxWidth: '600px' }}>
         {!loading && !child && <p>No child registered.</p>}
         {child && (
           <div className="stack-list">
             <p><strong>Student Name:</strong> {child.student_name}</p>
             <p><strong>School Name:</strong> {child.school_name}</p>
             <p><strong>Admission Number:</strong> {child.admission_number}</p>
             <p><strong>Grade / Class:</strong> {child.grade}</p>
             <p><strong>Home Location:</strong> {child.location}</p>
           </div>
         )}
      </div>
    </div>
  );
};

export const TripsAndRoutes = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTrips = async () => {
    try {
      const res = await fetchParentTrips();
      setData(res);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { loadTrips(); }, []);

  const handlePayment = async (tripType, tripId, amount) => {
    const phone = prompt(`Enter your M-Pesa Phone Number to pay KES ${amount} for this trip:`);
    if (!phone) return;
    try {
      await makeParentPayment({ trip_type: tripType, trip_id: tripId, phone_number: phone });
      alert("Payment initiated! The school admin will verify it shortly.");
      await loadTrips();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div>Loading trips...</div>;

  return (
    <div>
      <h1 className="page-title">My Child's Trips</h1>
      <p className="page-subtitle">View trips set for {data?.child?.student_name} ({data?.child?.grade}) and pay via M-Pesa to get assigned.</p>

      {error && <p className="auth-feedback auth-feedback-error">{error}</p>}

      <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Daily Transport</h2>
      <div className="card-grid">
        {data?.daily_trips?.length === 0 && <p className="page-subtitle">No daily trips available.</p>}
        {data?.daily_trips?.map(trip => (
          <div key={trip.id} className="card" style={{ borderLeft: '4px solid var(--color-brand)' }}>
             <h3>{trip.route_name}</h3>
             <p style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>Base Times: {trip.pickup_time} - {trip.dropoff_time}</p>
             <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Cost: KES {trip.amount}</p>
             
             {trip.payment_status === 'not_paid' && (
               <button className="btn" style={{ background: 'var(--color-bg-glass)', marginTop: '1rem', padding: '0.4rem 1rem' }} onClick={() => handlePayment('daily', trip.id, trip.amount)}>Pay Now</button>
             )}
             {trip.payment_status === 'submitted' && <p style={{ color: 'var(--color-brand)', marginTop: '1rem' }}>Payment processing...</p>}
             {trip.payment_status === 'approved' && trip.assignment && (
               <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                 <p style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Assigned!</p>
                 <p style={{ fontSize: '0.85rem' }}>Pickup: {trip.assignment.assigned_pickup_time}</p>
                 <p style={{ fontSize: '0.85rem' }}>Driver: {trip.assignment.driver_name} ({trip.assignment.driver_phone})</p>
               </div>
             )}
             {trip.payment_status === 'approved' && !trip.assignment && <p style={{ color: 'var(--color-success)', marginTop: '1rem' }}>Paid! Waiting for admin assignment.</p>}
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Educational Trips</h2>
      <div className="card-grid">
        {data?.educational_trips?.length === 0 && <p className="page-subtitle">No educational trips available.</p>}
        {data?.educational_trips?.map(trip => (
          <div key={trip.id} className="card" style={{ borderLeft: '4px solid #A855F7' }}>
             <h3>{trip.trip_title}</h3>
             <p style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>{trip.destination} | {trip.duration_days} days</p>
             <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Cost: KES {trip.amount}</p>
             
             {trip.payment_status === 'not_paid' && (
               <button className="btn" style={{ background: 'var(--color-bg-glass)', marginTop: '1rem', padding: '0.4rem 1rem' }} onClick={() => handlePayment('educational', trip.id, trip.amount)}>Pay Now</button>
             )}
             {trip.payment_status === 'submitted' && <p style={{ color: 'var(--color-brand)', marginTop: '1rem' }}>Payment processing...</p>}
             {trip.payment_status === 'approved' && <p style={{ color: 'var(--color-success)', marginTop: '1rem' }}>Paid and confirmed!</p>}
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Closing Day Transport</h2>
      <div className="stack-list">
        {data?.closing_trips?.length === 0 && <p className="page-subtitle">No closing day trips scheduled.</p>}
        {data?.closing_trips?.map(trip => (
          <div key={trip.id} className="card" style={{ borderLeft: '4px solid var(--color-teal)' }}>
            <h3>Closing Day: {trip.closing_day}</h3>
            {trip.notes && <p style={{ color: 'var(--color-text-muted)' }}>{trip.notes}</p>}

            {trip.assignment ? (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(34,197,94,0.1)', borderRadius: '8px' }}>
                <p style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Sacco Driver Assigned!</p>
                <p>Driver: {trip.assignment.driver_name} ({trip.assignment.driver_phone})</p>
                <p>Plate: {trip.assignment.number_plate}</p>
              </div>
            ) : (
              <div className="stack-list" style={{ marginTop: '1rem' }}>
                {trip.fares.length === 0 && <p className="page-subtitle">No routes available yet.</p>}
                {trip.fares.map(fare => (
                  <div key={fare.id} className="stack-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{fare.route_name}</strong>
                      <p style={{ fontSize: '0.85rem' }}>{fare.from_terminal_name} &rarr; {fare.to_terminal_name} (KES {fare.amount})</p>
                    </div>
                    {fare.payment_status === 'not_paid' && (
                      <button className="btn btn-outline" style={{ width: 'auto', padding: '0.3rem 0.8rem' }} onClick={() => handlePayment('closing', fare.id, fare.amount)}>Pay KES {fare.amount}</button>
                    )}
                    {fare.payment_status === 'submitted' && <span style={{ color: 'var(--color-brand)' }}>Processing...</span>}
                    {fare.payment_status === 'approved' && <span style={{ color: 'var(--color-success)' }}>Paid! Waiting assign.</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const MpesaPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const res = await fetchParentPayments();
        setPayments(res.payments || []);
      } catch (err) { } finally { setLoading(false); }
    };
    loadPayments();
  }, []);

  return (
    <div>
      <h1 className="page-title">My Payments</h1>
      <p className="page-subtitle">History of all your STK push M-Pesa transactions.</p>

      <div className="card" style={{ padding: 0 }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Trip Type</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Mpesa Ref</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading && payments.length === 0 && <tr><td colSpan="6" className="empty-table-cell">No payments found.</td></tr>}
              {payments.map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.approved_at || p.created_at).toLocaleDateString()}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.trip_type}</td>
                  <td>{p.student_name}</td>
                  <td>KES {p.amount}</td>
                  <td>{p.mpesa_reference || 'Pending'}</td>
                  <td>
                    <span className={`role-chip ${p.status === 'approved' ? '' : 'passive'}`}>{p.status}</span>
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

export const ParentNotifications = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchParentNotifications();
        setData(res);
      } catch (err) { } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div>Loading notifications...</div>;

  return (
    <div>
      <h1 className="page-title">Notifications & Assignments</h1>
      <p className="page-subtitle">Real-time alerts regarding your child's transport.</p>

      <div className="role-middle-grid">
        <article className="card">
          <h3>Daily Transport Drivers</h3>
          <div className="stack-list" style={{ marginTop: '1rem' }}>
            {data?.daily_assignments?.length === 0 && <p className="page-subtitle">No drivers assigned yet.</p>}
            {data?.daily_assignments?.map((a, i) => (
              <div key={i} className="stack-item" style={{ borderLeft: '4px solid var(--color-brand)' }}>
                <strong>Pickup Time: {a.assigned_pickup_time}</strong>
                <p>Driver: {a.driver_name} | {a.driver_phone}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Base Route: {a.pickup_time} - {a.dropoff_time}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h3>Closing Day Drivers (Sacco)</h3>
          <div className="stack-list" style={{ marginTop: '1rem' }}>
            {data?.closing_assignments?.length === 0 && <p className="page-subtitle">No closing drivers assigned yet.</p>}
            {data?.closing_assignments?.map((a, i) => (
              <div key={i} className="stack-item" style={{ borderLeft: '4px solid var(--color-teal)' }}>
                <strong>Closing Day: {a.closing_day}</strong>
                <p>Driver: {a.driver_name} | {a.driver_phone}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Plate: {a.number_plate}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
};
