import React, { useEffect, useMemo, useState } from 'react';
import {
  bookBookingTrip,
  fetchBookingCompanies,
  fetchBookingCompany,
  fetchBookingRoute,
  fetchBookingTrip,
} from '../../../services/bookingApi';

export const PassengerBooking = () => {
  const [step, setStep] = useState(1);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await fetchBookingCompanies();
        setCompanies(response.companies);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  const availableSeats = useMemo(
    () => (selectedTrip?.seats ?? []).filter((seat) => seat.available),
    [selectedTrip],
  );

  const handleCompanySelect = async (company) => {
    try {
      setError('');
      const response = await fetchBookingCompany(company.slug);
      setSelectedCompany(response.company);
      setSelectedRoute(null);
      setSelectedTrip(null);
      setSelectedSeat('');
      setStep(2);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleRouteSelect = async (routeId) => {
    try {
      setError('');
      const response = await fetchBookingRoute(routeId);
      setSelectedRoute(response.route);
      setSelectedTrip(null);
      setSelectedSeat('');
      setStep(3);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleTripSelect = async (tripId) => {
    try {
      setError('');
      const response = await fetchBookingTrip(tripId);
      setSelectedTrip(response.trip);
      setSelectedSeat('');
      setStep(4);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handlePayment = async (event) => {
    event.preventDefault();

    try {
      setError('');
      setMessage('');
      const response = await bookBookingTrip(selectedTrip.id, {
        phone,
        seat: selectedSeat,
      });
      setMessage(
        `${response.message} M-Pesa prompt prepared for ${response.payment.phone} on seat ${response.payment.seat}.`,
      );
      setStep(5);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const resetBooking = () => {
    setStep(1);
    setSelectedCompany(null);
    setSelectedRoute(null);
    setSelectedTrip(null);
    setSelectedSeat('');
    setPhone('');
    setMessage('');
    setError('');
  };

  if (loading) {
    return <p className="page-subtitle">Loading registered booking services...</p>;
  }

  return (
    <div>
      <h1 className="page-title">Booking Services</h1>
      <p className="page-subtitle">
        {step === 1 && 'View all registered booking services and choose a company.'}
        {step === 2 && `Routes and fares for ${selectedCompany?.name}.`}
        {step === 3 && `Trip times for ${selectedRoute?.name}.`}
        {step === 4 && 'Choose a time, free seat, and payment phone number.'}
        {step === 5 && 'Payment prompt prepared for the selected trip.'}
      </p>

      {error ? <p style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{error}</p> : null}

      {step === 1 && (
        <div className="card-grid">
          {companies.map((company) => (
            <div
              key={company.id}
              className="card"
              onClick={() => handleCompanySelect(company)}
              style={{ cursor: 'pointer' }}
            >
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-brand)' }}>{company.name}</h3>
              <p style={{ color: 'var(--color-text-muted)' }}>{company.location}</p>
              <p style={{ color: 'var(--color-text-muted)' }}>{company.contact_phone}</p>
              <p style={{ color: 'var(--color-text-muted)' }}>{company.contact_email}</p>
              <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>{company.route_count} registered routes</p>
            </div>
          ))}
        </div>
      )}

      {step === 2 && selectedCompany && (
        <div>
          <button className="btn btn-outline" onClick={() => setStep(1)} style={{ marginBottom: '1rem' }}>
            &larr; Back to booking companies
          </button>
          <div className="card-grid">
            {selectedCompany.routes.map((route) => (
              <div className="card" key={route.id}>
                <h3>{route.name}</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>{route.departure} to {route.destination}</p>
                <p style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>KES {route.fare}</p>
                <button className="btn btn-primary" onClick={() => handleRouteSelect(route.id)}>
                  View Trip Times
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && selectedRoute && (
        <div>
          <button className="btn btn-outline" onClick={() => setStep(2)} style={{ marginBottom: '1rem' }}>
            &larr; Back to routes
          </button>
          <div className="card-grid">
            {selectedRoute.trips.map((trip) => (
              <div className="card" key={trip.id}>
                <h3>{trip.time}</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>Driver: {trip.driver_name}</p>
                <p style={{ color: 'var(--color-text-muted)' }}>Departure point: {trip.major_departure_point}</p>
                <p style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>KES {trip.fare}</p>
                <p>{trip.available_seats} free seats</p>
                <button className="btn btn-primary" onClick={() => handleTripSelect(trip.id)}>
                  Select This Time
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && selectedTrip && (
        <div>
          <button className="btn btn-outline" onClick={() => setStep(3)} style={{ marginBottom: '1rem' }}>
            &larr; Back to trip times
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="card">
              <h3>Select a Free Seat</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
                {(selectedTrip.seats ?? []).map((seat) => (
                  <button
                    key={seat.number}
                    onClick={() => seat.available && setSelectedSeat(seat.number)}
                    type="button"
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: selectedSeat === seat.number ? 'var(--color-brand)' : (seat.available ? 'var(--color-bg-glass)' : 'rgba(255,0,0,0.12)'),
                      color: selectedSeat === seat.number ? '#000' : 'var(--color-text-main)',
                      cursor: seat.available ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {seat.number}
                  </button>
                ))}
              </div>
              <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>
                Free seats: {availableSeats.map((seat) => seat.number).join(', ') || 'None'}
              </p>
            </div>

            <div className="card">
              <h3>Phone Number and Payment</h3>
              <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                Enter your phone number, confirm the seat, then proceed to payment.
              </p>
              <form onSubmit={handlePayment}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-input"
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="e.g. 0712345678 or +254712345678"
                    required
                    value={phone}
                  />
                </div>
                <div style={{ background: 'var(--color-bg-glass)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <p><strong>Trip time:</strong> {selectedTrip.time}</p>
                  <p><strong>Fare:</strong> KES {selectedTrip.fare}</p>
                  <p><strong>Selected seat:</strong> {selectedSeat || 'Not selected'}</p>
                </div>
                <button className="btn btn-primary" disabled={!selectedSeat} type="submit">
                  Prompt Payment
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
          <h2 style={{ color: 'var(--color-success)', marginBottom: '1rem' }}>Payment Prompt Ready</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>{message}</p>
          <button className="btn btn-primary" onClick={resetBooking}>
            Book Another Trip
          </button>
        </div>
      )}
    </div>
  );
};

export const MyTickets = () => {
  return (
    <div>
      <h1 className="page-title">My Tickets</h1>
      <p className="page-subtitle">Active and completed bookings will appear here.</p>
      <div className="card">
        <p style={{ color: 'var(--color-text-muted)' }}>
          This section is ready for your next step when you want to save real passenger bookings to the database.
        </p>
      </div>
    </div>
  );
};
