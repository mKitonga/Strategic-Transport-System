import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHomepage, fetchPublicDirectories } from '../../services/transportApi';
import { fetchBookingCompanies, fetchBookingCompany } from '../../services/bookingApi';
import TrafficMap from '../dashboard/shared/TrafficMap';

const SectionIntro = ({ eyebrow, title, body }) => (
  <div className="section-intro">
    <p className="stage-eyebrow">{eyebrow}</p>
    <h2>{title}</h2>
    <p>{body}</p>
  </div>
);

function usePublicDirectories() {
  const [directories, setDirectories] = useState({ saccos: [], schools: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchPublicDirectories()
      .then((data) => { if (active) setDirectories(data); })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load the public directory.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { directories, loading, error };
}

export const Home = () => {
  const [overview, setOverview] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    fetchHomepage()
      .then((data) => { if (active) setOverview(data); })
      .catch((error) => { if (active) setLoadError(error.message || 'Could not load Control Deck data.'); });
    return () => { active = false; };
  }, []);

  const stats = overview?.public_stats;
  const pulse = [
    { label: 'Active SACCOs', value: stats?.active_saccos, note: 'Active SACCO administrator accounts' },
    { label: 'Partner Schools', value: stats?.partner_schools, note: 'Active school and location profiles' },
    { label: 'Registered SACCO Routes', value: stats?.registered_routes, note: 'Routes registered in the backend' },
  ];

  return (
  <div className="public-page home-page" style={{ padding: '0.5rem' }}>
    <section className="transit-hero" style={{ padding: '1.5rem', minHeight: '320px', marginBottom: '0.75rem' }}>
      <div className="transit-hero-copy">
        <p className="stage-eyebrow">Gateway</p>
        <h2 style={{ fontSize: '1.75rem', lineHeight: 1.2, marginBottom: '0.5rem' }}>Strategic Transport Command</h2>
        <p style={{ fontSize: '0.9rem', marginBottom: '1rem', maxWidth: '480px' }}>
          One desk for public movement, school coordination, and booking access. The figures and configured routes below come from the backend.
        </p>
        <div className="hero-actions" style={{ gap: '0.5rem' }}>
          <Link to="/auth/register" className="nav-btn nav-btn-primary" style={{ padding: '0.5rem 1rem' }}>Create Account</Link>
          <Link to="/booking" className="nav-btn nav-btn-outline" style={{ padding: '0.5rem 1rem' }}>Booking Desk</Link>
        </div>
      </div>
      <div className="route-map-card" style={{ padding: '1rem' }}>
        <div className="route-map-header" style={{ marginBottom: '0.75rem' }}>
          <strong>Network Grid</strong>
          <span>Routes from the backend</span>
        </div>
        {loadError ? <p role="alert">{loadError}</p> : overview && overview.featured_routes?.length ? (
          <div className="route-lines" style={{ gap: '0.4rem' }}>
            {overview.featured_routes.map((route, index) => (
              <div className={`route-line ${['amber', 'teal', 'green'][index % 3]}`} key={route.id} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                <span>{route.route_name}</span><span>{route.location || route.sacco_name}</span>
              </div>
            ))}
          </div>
        ) : <p>{overview ? 'No routes are currently registered for active SACCOs.' : 'Loading registered routes...'}</p>}
      </div>
    </section>

    <section className="transport-pulse-grid" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
      {pulse.map((item) => (
        <article className="transport-pulse-card" key={item.label} style={{ padding: '0.75rem' }}>
          <span style={{ fontSize: '0.7rem' }}>{item.label}</span>
          <strong style={{ fontSize: '1.25rem' }}>{item.value ?? (loadError ? 'Unavailable' : 'Loading...')}</strong>
          <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>{item.note}</p>
        </article>
      ))}
    </section>
    {loadError && <p role="alert" className="page-subtitle" style={{ color: 'var(--color-danger)' }}>{loadError}</p>}

    <section className="operations-split compact-ops" style={{ gap: '0.5rem' }}>
      <div className="operations-panel" style={{ padding: '1rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Operational Snapshot</h3>
        <div className="ops-list" style={{ gap: '0.4rem' }}>
          <div className="ops-item">
            <strong style={{ fontSize: '0.85rem' }}>SACCO Visibility</strong>
            <span style={{ fontSize: '0.8rem' }}>Track presence and route availability.</span>
          </div>
          <div className="ops-item">
            <strong style={{ fontSize: '0.85rem' }}>School Trust</strong>
            <span style={{ fontSize: '0.8rem' }}>Participating schools and admins.</span>
          </div>
        </div>
      </div>
      <div className="operations-panel accent" style={{ padding: '1rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>System Access</h3>
        <div className="ops-tags" style={{ gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>Traffic Board</span>
          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>SACCO Directory</span>
          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>School Directory</span>
          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>Help Centre</span>
        </div>
      </div>
    </section>
  </div>
  );
};

export const TrafficUpdates = () => (
  <div className="public-page">
    <SectionIntro
      eyebrow="Traffic Updates"
      title="Live traffic flow and incidents around Nairobi"
      body="TomTom traffic flow and incident overlays update on the map. Pan or zoom to inspect other covered areas."
    />
    <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
      <TrafficMap center={[36.8219, -1.2921]} zoom={11} />
    </div>
  </div>
);

export const SaccosList = () => {
  const { directories, loading, error } = usePublicDirectories();
  return <div className="public-page">
    <SectionIntro
      eyebrow="SACCO Directory"
      title="Registered SACCOs, routes, and administrator contacts"
      body="Passengers and new users can inspect verified public transport operators before using the system."
    />
    <div className="info-grid">
      {directories.saccos.map((sacco) => (
        <article className="info-card" key={sacco.id}>
          <div className="info-topline">
            <strong>{sacco.name}</strong>
            <span className="status-pill live">{sacco.location || 'Location not provided'}</span>
          </div>
          <p><strong>Routes:</strong> {sacco.routes.length ? sacco.routes.map((route) => route.name).join(', ') : 'No routes registered'}</p>
          {sacco.routes.map((route) => route.terminals.length > 0 && (
            <p key={route.id}><strong>{route.name} terminals:</strong> {route.terminals.join(' -> ')}</p>
          ))}
          <p><strong>SACCO Admin:</strong> {sacco.admin}</p>
          <p><strong>Phone:</strong> {sacco.phone}</p>
          <p><strong>Email:</strong> {sacco.email}</p>
        </article>
      ))}
      {!loading && !error && directories.saccos.length === 0 && <p className="page-subtitle">No active SACCOs are registered yet.</p>}
      {loading && <p className="page-subtitle">Loading SACCOs from the backend...</p>}
      {error && <p role="alert" className="page-subtitle" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  </div>
};

export const SchoolsList = () => {
  const { directories, loading, error } = usePublicDirectories();
  return <div className="public-page">
    <SectionIntro
      eyebrow="School Routes"
      title="Registered school routes, terminals, and administrators"
      body="Browse school transport routes and terminal sequences recorded in the backend."
    />
    <div className="info-grid">
      {directories.schools.map((school) => (
        <article className="info-card" key={school.id}>
          <div className="info-topline">
            <strong>{school.name}</strong>
            <span className="status-pill teal">{school.location || 'Location not provided'}</span>
          </div>
          {school.routes.length ? school.routes.map((route) => (
            <p key={route.id}><strong>{route.name}:</strong> {route.terminals.length ? route.terminals.join(' -> ') : 'No terminals registered'}</p>
          )) : <p>No school routes registered yet.</p>}
          <p><strong>School Admin:</strong> {school.admin}</p>
          <p><strong>Phone:</strong> {school.phone}</p>
          <p><strong>Email:</strong> {school.email}</p>
        </article>
      ))}
      {!loading && !error && directories.schools.length === 0 && <p className="page-subtitle">No active schools are registered yet.</p>}
      {loading && <p className="page-subtitle">Loading school routes from the backend...</p>}
      {error && <p role="alert" className="page-subtitle" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  </div>
};

export const TermsConditions = () => (
  <div className="public-page narrow-page">
    <SectionIntro
      eyebrow="Terms"
      title="Transport rules and operational expectations"
      body="These terms guide how operators, drivers, parents, schools, and passengers use the system."
    />
    <div className="info-card prose-card">
      <p>Only accurate and verifiable registration details should be submitted into the system.</p>
      <p>Drivers should only operate after approval under the correct transport role.</p>
      <p>Passengers are expected to follow booking instructions, payment prompts, and seat allocation rules.</p>
    </div>
  </div>
);

export const PrivacyPolicy = () => (
  <div className="public-page narrow-page">
    <SectionIntro
      eyebrow="Privacy"
      title="How transport data and user records are handled"
      body="The system stores just enough information to support safe travel coordination, accountability, and communication."
    />
    <div className="info-card prose-card">
      <p>Contact details are used for route coordination, alerts, booking confirmation, and support.</p>
      <p>Student and parent records must only be accessed by authorized school and transport users.</p>
      <p>Booking, route, and operator information should remain protected from unauthorized access.</p>
    </div>
  </div>
);

export const HelpCenter = () => (
  <div className="public-page">
    <SectionIntro
      eyebrow="Help"
      title="Guide new users through the platform"
      body="This page is dedicated to helping first-time users understand how to browse the public dashboard and access the system correctly."
    />
    <div className="operations-split">
      <div className="operations-panel">
        <h3>How to use the system</h3>
        <div className="ops-list">
          <div className="ops-item">
            <strong>1. Start with the public dashboard</strong>
            <span>Use the left rail to view traffic, SACCOs, schools, policies, help, and booking services.</span>
          </div>
          <div className="ops-item">
            <strong>2. Register using your role</strong>
            <span>Choose the correct role and complete the exact fields requested for that user type.</span>
          </div>
          <div className="ops-item">
            <strong>3. Log in with your saved details</strong>
            <span>After registration, use the same email and password to access your own page.</span>
          </div>
        </div>
      </div>
      <div className="operations-panel accent">
        <h3>Passenger support</h3>
        <p>If you face a problem with a vehicle or service, you can submit a formal complaint against SACCOs, schools, or booking companies.</p>
        <Link to="/complaints" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
          Go to Complaints Desk
        </Link>
      </div>
    </div>
  </div>
);

export const PassengerComplaints = () => {
  const [step, setStep] = React.useState(1);
  const [options, setOptions] = React.useState({ saccos: [], schools: [], booking_companies: [] });
  const [formData, setFormData] = React.useState({
    service_type: '',
    service_name: '',
    route_name: '',
    location: '',
    passenger_phone: '',
    passenger_email: '',
    message: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [optionsLoading, setOptionsLoading] = React.useState(true);
  const [optionsError, setOptionsError] = React.useState('');
  const [optionsRetry, setOptionsRetry] = React.useState(0);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setOptionsLoading(true);
    setOptionsError('');

    fetch('/api/complaints/options')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not load service operators.');
        if (!cancelled) {
          setOptions({
            saccos: data.saccos || [],
            schools: data.schools || [],
            booking_companies: data.booking_companies || [],
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setOptionsError(err.message || 'Could not load service operators.');
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });

    return () => { cancelled = true; };
  }, [optionsRetry]);

  const handleTypeSelect = (type) => {
    setFormData({ ...formData, service_type: type, service_name: '', route_name: '', location: '' });
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (response.ok) {
        setSuccess(true);
      } else {
        setError(result.message || 'Something went wrong.');
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="public-page narrow-page">
        <div className="card text-center" style={{ padding: '4rem 2rem', border: '2px solid var(--color-brand)' }}>
          <div className="status-pill live" style={{ marginBottom: '1.5rem', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>Ticket Issued Successfully</div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>We've Received Your Report</h2>
          <p className="page-subtitle" style={{ maxWidth: '500px', margin: '0 auto 2rem' }}>
            Your feedback has been routed to the respective transport administrator. 
            We prioritize safety and fair conduct in our network.
          </p>
          <button onClick={() => { setSuccess(false); setStep(1); setFormData({ service_type: '', service_name: '', route_name: '', location: '', passenger_phone: '', passenger_email: '', message: '' }); }} className="btn btn-primary">
            File another report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page narrow-page">
      <div className="section-intro">
        <p className="stage-eyebrow">Redress Desk</p>
        <h2>Transport Conduct Reporting</h2>
        <p>Ensure every operator in our network remains accountable. Select the service type below to start your report.</p>
      </div>

      {/* Progress Indicator */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ 
            flex: 1, 
            height: '4px', 
            background: step >= s ? 'var(--color-brand)' : 'var(--color-border)',
            opacity: step >= s ? 1 : 0.3,
            borderRadius: '2px'
          }} />
        ))}
      </div>

      <div className="card" style={{ position: 'relative' }}>
        {error && <p className="auth-feedback auth-feedback-error">{error}</p>}

        {step === 1 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Select Service Category</h3>
            <div className="complaint-category-grid">
              <button type="button" aria-pressed={formData.service_type === 'sacco'} className={`complaint-category-card ${formData.service_type === 'sacco' ? 'active' : ''}`} onClick={() => handleTypeSelect('sacco')}>
                <strong>SACCO Service</strong>
                <span>Matatus & Urban Transit</span>
              </button>
              <button type="button" aria-pressed={formData.service_type === 'school'} className={`complaint-category-card ${formData.service_type === 'school' ? 'active' : ''}`} onClick={() => handleTypeSelect('school')}>
                <strong>School Transport</strong>
                <span>Student Pickup Services</span>
              </button>
              <button type="button" aria-pressed={formData.service_type === 'booking'} className={`complaint-category-card ${formData.service_type === 'booking' ? 'active' : ''}`} onClick={() => handleTypeSelect('booking')}>
                <strong>Booking Service</strong>
                <span>Long Distance Companies</span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Assign to Operator</h3>
            <div className="form-group">
              <label className="form-label">Select {formData.service_type === 'sacco' ? 'SACCO' : formData.service_type === 'school' ? 'School' : 'Company'}</label>
              {optionsError && (
                <div className="auth-feedback auth-feedback-error" role="alert">
                  {optionsError}{' '}
                  <button type="button" className="btn btn-outline" onClick={() => setOptionsRetry((retry) => retry + 1)}>Retry</button>
                </div>
              )}
              <select 
                className="form-select" 
                value={formData.service_name} 
                disabled={optionsLoading || Boolean(optionsError)}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value, route_name: '', location: '' })}
              >
                <option value="">
                  {optionsLoading ? 'Loading operators...' : optionsError ? 'Unable to load operators' : 'Choose operator...'}
                </option>
                {formData.service_type === 'sacco' && options.saccos.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                {formData.service_type === 'school' && options.schools.map(s => <option key={`${s.name}-${s.locations?.[0] || ''}`} value={s.name}>{s.name}</option>)}
                {formData.service_type === 'booking' && options.booking_companies.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              {!optionsLoading && !optionsError && !(
                formData.service_type === 'sacco' ? options.saccos.length :
                  formData.service_type === 'school' ? options.schools.length : options.booking_companies.length
              ) && <small className="page-subtitle">No registered operators are available for this category yet.</small>}
            </div>

            {formData.service_type === 'school' ? (
              <div className="form-group">
                <label className="form-label">Zone / Location</label>
                <select 
                  className="form-select" 
                  value={formData.location} 
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={!formData.service_name}
                >
                  <option value="">Choose location...</option>
                  {options.schools.find(s => s.name === formData.service_name)?.locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Specific Route</label>
                <select 
                  className="form-select" 
                  value={formData.route_name} 
                  onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                  disabled={!formData.service_name}
                >
                  <option value="">Choose route...</option>
                  {formData.service_type === 'sacco' && options.saccos.find(s => s.name === formData.service_name)?.routes.map(r => <option key={r} value={r}>{r}</option>)}
                  {formData.service_type === 'booking' && options.booking_companies.find(s => s.name === formData.service_name)?.routes.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            <div className="hero-actions" style={{ marginTop: '2rem' }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>Previous</button>
              <button 
                className="btn btn-primary" 
                onClick={() => setStep(3)} 
                disabled={!formData.service_name || (formData.service_type === 'school' ? !formData.location : !formData.route_name)}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="fade-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Finalize Report</h3>
            <div className="auth-grid auth-grid-two">
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="07..." 
                  value={formData.passenger_phone}
                  onChange={(e) => setFormData({ ...formData, passenger_phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email (Optional)</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@email.com" 
                  value={formData.passenger_email}
                  onChange={(e) => setFormData({ ...formData, passenger_email: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Details of Incident</label>
              <textarea 
                required 
                className="form-input" 
                style={{ minHeight: '140px', borderRadius: '4px' }} 
                placeholder="Please describe exactly what happened..." 
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <div className="hero-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || !formData.message || (!formData.passenger_phone && !formData.passenger_email)}
              >
                {loading ? 'Processing...' : 'Submit Final Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const BookingServices = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchBookingCompanies()
      .then(async ({ companies: listedCompanies = [] }) => {
        const details = await Promise.all(listedCompanies.map(async (company) => {
          const response = await fetchBookingCompany(encodeURIComponent(company.slug));
          return response.company;
        }));
        if (active) setCompanies(details);
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load booking services.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <div className="public-page">
    <SectionIntro
      eyebrow="Booking Services"
      title="Long-distance travel companies open to passengers"
      body="Company, route, and fare information is loaded from the booking service configured in the backend."
    />
    <div className="info-grid">
      {companies.map((company) => (
        <article className="info-card" key={company.id}>
          <div className="info-topline">
            <strong>{company.name}</strong>
            <span className="status-pill live">{company.location || 'Location not provided'}</span>
          </div>
          {company.routes?.length ? company.routes.map((route) => (
            <p key={route.id}>
              <strong>{route.name}:</strong> {route.departure} to {route.destination} - KES {Number(route.fare).toLocaleString()}
            </p>
          )) : <p>No routes configured for this company.</p>}
          {company.contact_phone && <p><strong>Phone:</strong> {company.contact_phone}</p>}
          {company.contact_email && <p><strong>Email:</strong> {company.contact_email}</p>}
          <Link to="/dashboard/passenger/book" className="inline-route-link">
            Open booking flow
          </Link>
        </article>
      ))}
      {loading && <p className="page-subtitle">Loading booking services from the backend...</p>}
      {!loading && !error && companies.length === 0 && <p className="page-subtitle">No booking companies are configured yet.</p>}
      {error && <p role="alert" className="page-subtitle" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  </div>
};
