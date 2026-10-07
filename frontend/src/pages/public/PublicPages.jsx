import React from 'react';
import { Link } from 'react-router-dom';

const transportPulse = [
  { label: 'Active SACCOs', value: '150+', note: 'Verified route operators' },
  { label: 'Partner Schools', value: '450+', note: 'Mapped to school transport zones' },
  { label: 'Daily Riders', value: '12K+', note: 'Passengers moving through the system' },
  { label: 'Tracked Routes', value: '50+', note: 'Live public and booking corridors' },
];

const trafficData = [
  { corridor: 'A104 / Waiyaki Way', condition: 'Heavy traffic', eta: '30 min delay', detail: 'Congestion building near Westlands roundabout.' },
  { corridor: 'Thika Superhighway', condition: 'Smooth movement', eta: 'On schedule', detail: 'Outbound lanes are flowing with minimal interruption.' },
  { corridor: 'Ngong Road', condition: 'Moderate traffic', eta: '12 min delay', detail: 'School pickup traffic near Adams Arcade.' },
];

const saccos = [
  {
    name: 'Super Metro SACCO',
    routes: ['CBD - Kikuyu', 'CBD - Waiyaki Way'],
    location: 'Railways stage',
    admin: 'Grace Muthoni',
    phone: '+254700000000',
    email: 'admin@supermetro.co.ke',
  },
  {
    name: 'Embassava SACCO',
    routes: ['CBD - Rongai', 'CBD - Ngong'],
    location: 'Tea Room terminal',
    admin: 'Kevin Otieno',
    phone: '+254711222333',
    email: 'kevin@embassava.co.ke',
  },
];

const schools = [
  {
    name: 'Nairobi Primary School',
    location: 'Kilimani',
    admin: 'Esther Akinyi',
    phone: '+254722345678',
    email: 'info@nps.ac.ke',
  },
  {
    name: 'Riverside Academy',
    location: 'Ruiru',
    admin: 'Patrick Maina',
    phone: '+254733456789',
    email: 'admin@riversideacademy.ac.ke',
  },
];

const bookingCompanies = [
  { name: 'Ena Coach', route: 'Nairobi - Mombasa - Malindi', fare: 'From KES 1,500' },
  { name: 'Tahmeed Coach', route: 'Nairobi - Mombasa', fare: 'From KES 1,800' },
  { name: 'Modern Coast', route: 'Nairobi - Kisumu', fare: 'From KES 1,200' },
];

const SectionIntro = ({ eyebrow, title, body }) => (
  <div className="section-intro">
    <p className="stage-eyebrow">{eyebrow}</p>
    <h2>{title}</h2>
    <p>{body}</p>
  </div>
);

export const Home = () => (
  <div className="public-page home-page" style={{ padding: '0.5rem' }}>
    <section className="transit-hero" style={{ padding: '1.5rem', minHeight: '320px', marginBottom: '0.75rem' }}>
      <div className="transit-hero-copy">
        <p className="stage-eyebrow">Gateway</p>
        <h2 style={{ fontSize: '1.75rem', lineHeight: 1.2, marginBottom: '0.5rem' }}>Strategic Transport Command</h2>
        <p style={{ fontSize: '0.9rem', marginBottom: '1rem', maxWidth: '480px' }}>
          One desk for public movement, school coordination, and booking access. Use the sidebar to monitor traffic and verified operators.
        </p>
        <div className="hero-actions" style={{ gap: '0.5rem' }}>
          <Link to="/auth/register" className="nav-btn nav-btn-primary" style={{ padding: '0.5rem 1rem' }}>Create Account</Link>
          <Link to="/booking" className="nav-btn nav-btn-outline" style={{ padding: '0.5rem 1rem' }}>Booking Desk</Link>
        </div>
      </div>
      <div className="route-map-card" style={{ padding: '1rem' }}>
        <div className="route-map-header" style={{ marginBottom: '0.75rem' }}>
          <strong>Network Grid</strong>
          <span>Live Map Overview</span>
        </div>
        <div className="route-lines" style={{ gap: '0.4rem' }}>
          <div className="route-line amber" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
            <span>CBD</span><span>Kikuyu</span>
          </div>
          <div className="route-line teal" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
            <span>Kilimani</span><span>Thika</span>
          </div>
          <div className="route-line green" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
            <span>Nairobi</span><span>Mombasa</span>
          </div>
        </div>
      </div>
    </section>

    <section className="transport-pulse-grid" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
      {transportPulse.map((item) => (
        <article className="transport-pulse-card" key={item.label} style={{ padding: '0.75rem' }}>
          <span style={{ fontSize: '0.7rem' }}>{item.label}</span>
          <strong style={{ fontSize: '1.25rem' }}>{item.value}</strong>
          <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>{item.note}</p>
        </article>
      ))}
    </section>

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

export const TrafficUpdates = () => (
  <div className="public-page">
    <SectionIntro
      eyebrow="Traffic Updates"
      title="Live corridor conditions for passengers and operators"
      body="Use these updates before dispatching vehicles, assigning routes, or leaving for a trip."
    />
    <div className="info-grid">
      {trafficData.map((item) => (
        <article className="info-card" key={item.corridor}>
          <div className="info-topline">
            <strong>{item.corridor}</strong>
            <span className="status-pill amber">{item.condition}</span>
          </div>
          <p><strong>Expected effect:</strong> {item.eta}</p>
          <p>{item.detail}</p>
        </article>
      ))}
    </div>
  </div>
);

export const SaccosList = () => (
  <div className="public-page">
    <SectionIntro
      eyebrow="SACCO Directory"
      title="Registered SACCOs, routes, and administrator contacts"
      body="Passengers and new users can inspect verified public transport operators before using the system."
    />
    <div className="info-grid">
      {saccos.map((sacco) => (
        <article className="info-card" key={sacco.name}>
          <div className="info-topline">
            <strong>{sacco.name}</strong>
            <span className="status-pill live">{sacco.location}</span>
          </div>
          <p><strong>Routes:</strong> {sacco.routes.join(', ')}</p>
          <p><strong>SACCO Admin:</strong> {sacco.admin}</p>
          <p><strong>Phone:</strong> {sacco.phone}</p>
          <p><strong>Email:</strong> {sacco.email}</p>
        </article>
      ))}
    </div>
  </div>
);

export const SchoolsList = () => (
  <div className="public-page">
    <SectionIntro
      eyebrow="School Directory"
      title="Registered schools, locations, and school-admin contacts"
      body="This area helps parents and transport stakeholders discover supported schools and who manages their transport setup."
    />
    <div className="info-grid">
      {schools.map((school) => (
        <article className="info-card" key={school.name}>
          <div className="info-topline">
            <strong>{school.name}</strong>
            <span className="status-pill teal">{school.location}</span>
          </div>
          <p><strong>School Admin:</strong> {school.admin}</p>
          <p><strong>Phone:</strong> {school.phone}</p>
          <p><strong>Email:</strong> {school.email}</p>
        </article>
      ))}
    </div>
  </div>
);

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
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/complaints/options')
      .then(res => res.json())
      .then(data => setOptions(data))
      .catch(err => console.error('Failed to load options', err));
  }, []);

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
            <div className="role-grid">
              <button className={`role-card ${formData.service_type === 'sacco' ? 'active' : ''}`} onClick={() => handleTypeSelect('sacco')}>
                <strong>SACCO Service</strong>
                <span>Matatus & Urban Transit</span>
              </button>
              <button className={`role-card ${formData.service_type === 'school' ? 'active' : ''}`} onClick={() => handleTypeSelect('school')}>
                <strong>School Transport</strong>
                <span>Student Pickup Services</span>
              </button>
              <button className={`role-card ${formData.service_type === 'booking' ? 'active' : ''}`} onClick={() => handleTypeSelect('booking')}>
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
              <select 
                className="form-select" 
                value={formData.service_name} 
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value, route_name: '', location: '' })}
              >
                <option value="">Choose operator...</option>
                {formData.service_type === 'sacco' && options.saccos.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                {formData.service_type === 'school' && options.schools.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                {formData.service_type === 'booking' && options.booking_companies.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
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

export const BookingServices = () => (
  <div className="public-page">
    <SectionIntro
      eyebrow="Booking Services"
      title="Long-distance travel companies open to passengers"
      body="Passengers can browse booking companies, inspect routes and fares, then proceed into times, seats, and payment prompts after login."
    />
    <div className="info-grid">
      {bookingCompanies.map((company) => (
        <article className="info-card" key={company.name}>
          <div className="info-topline">
            <strong>{company.name}</strong>
            <span className="status-pill live">{company.fare}</span>
          </div>
          <p><strong>Coverage:</strong> {company.route}</p>
          <Link to="/dashboard/passenger/book" className="inline-route-link">
            Open booking flow
          </Link>
        </article>
      ))}
    </div>
  </div>
);
