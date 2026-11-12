import React from 'react';
import { apiRequest } from '../services/transportApi';

const emptyComplaint = {
  service_type: '', service_name: '', route_name: '', location: '',
  passenger_phone: '', passenger_email: '', message: '',
};

const serviceLabels = { sacco: 'SACCO service', school: 'School transport', booking: 'Booking service' };

export default function PublicComplaintChat() {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState('service');
  const [options, setOptions] = React.useState({ saccos: [], schools: [], booking_companies: [] });
  const [optionsLoaded, setOptionsLoaded] = React.useState(false);
  const [form, setForm] = React.useState(emptyComplaint);
  const [loadingOptions, setLoadingOptions] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState('');
  const [reference, setReference] = React.useState(null);

  const loadOptions = React.useCallback(async () => {
    setLoadingOptions(true);
    setError('');
    try {
      const data = await apiRequest('/api/complaints/options');
      setOptions({ saccos: data.saccos || [], schools: data.schools || [], booking_companies: data.booking_companies || [] });
      setOptionsLoaded(true);
    } catch (err) {
      setError(err.message || 'Could not load registered services. Please try again.');
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const operators = form.service_type === 'sacco' ? options.saccos : form.service_type === 'school' ? options.schools : options.booking_companies;
  const operator = operators.find((item) => item.name === form.service_name);
  const destinations = form.service_type === 'school' ? (operator?.locations || []) : (operator?.routes || []);

  const chooseService = (service_type) => {
    setForm({ ...emptyComplaint, service_type });
    setError('');
    setStep('operator');
    if (!optionsLoaded && !loadingOptions) loadOptions();
  };

  const chooseOperator = (service_name) => {
    setForm((current) => ({ ...current, service_name, route_name: '', location: '' }));
    setError('');
  };

  const chooseDestination = (value) => {
    setForm((current) => ({ ...current, [current.service_type === 'school' ? 'location' : 'route_name']: value }));
    setError('');
    setStep('details');
  };

  const reviewComplaint = (event) => {
    event.preventDefault();
    if (!form.passenger_phone.trim() && !form.passenger_email.trim()) {
      setError('Please provide a phone number or email address so the administrator can contact you.');
      return;
    }
    if (form.message.trim().length < 10) {
      setError('Please describe what happened in at least 10 characters.');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const submitComplaint = async () => {
    setSending(true);
    setError('');
    try {
      const result = await apiRequest('/api/complaints', { method: 'POST', body: form });
      setReference(result.complaint_id);
      setStep('success');
    } catch (err) {
      setError(err.message || 'Could not submit your complaint. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const resetChat = () => {
    setForm(emptyComplaint);
    setReference(null);
    setError('');
    setStep('service');
  };

  const closeChat = () => setOpen(false);

  return (
    <div className="sts-complaint-chat">
      {open && <section className="sts-chat-panel" aria-label="STS complaint assistant">
        <header className="sts-chat-header">
          <div className="sts-chat-heading"><span className="sts-chat-status-dot" /><div><strong>STS Complaints Desk</strong><small>Complaint submission assistant</small></div></div>
          <button type="button" className="sts-chat-close" onClick={closeChat} aria-label="Close complaint chat">×</button>
        </header>
        <div className="sts-chat-body" aria-live="polite">
          <p className="sts-chat-intro">Hi. I can help you submit a complaint. I’ll guide you through the service details, then you can describe what happened in your own words.</p>

          {step === 'service' && <div className="sts-chat-card"><strong>1. Which service is your complaint about?</strong><div className="sts-chat-options">
            <button type="button" onClick={() => chooseService('sacco')}>SACCO service</button>
            <button type="button" onClick={() => chooseService('school')}>School transport</button>
            <button type="button" onClick={() => chooseService('booking')}>Booking service</button>
          </div></div>}

          {step === 'operator' && <div className="sts-chat-card"><strong>2. Choose the {form.service_type === 'sacco' ? 'SACCO' : form.service_type === 'school' ? 'school' : 'booking company'}.</strong>
            {loadingOptions ? <p className="sts-chat-muted">Loading registered services…</p> : error ? <><p className="sts-chat-error" role="alert">{error}</p><button type="button" className="sts-chat-option" onClick={loadOptions}>Retry loading services</button></> : operators.length ? <div className="sts-chat-options sts-chat-scroll-list">{operators.map((item, index) => <button type="button" key={`${item.name}-${index}`} className={form.service_name === item.name ? 'selected' : ''} onClick={() => chooseOperator(item.name)}>{item.name}</button>)}</div> : <p className="sts-chat-muted">No registered services are available in this category.</p>}
            {operator && <><strong className="sts-chat-subheading">{form.service_type === 'school' ? 'Choose the school location.' : 'Choose the route.'}</strong>{destinations.length ? <div className="sts-chat-options sts-chat-scroll-list">{destinations.map((destination, index) => <button type="button" key={`${destination}-${index}`} onClick={() => chooseDestination(destination)}>{destination}</button>)}</div> : <p className="sts-chat-muted">No route or location is configured for this service yet.</p>}</>}
            <button type="button" className="sts-chat-back" onClick={() => { setStep('service'); setError(''); }}>← Change service type</button>
          </div>}

          {step === 'details' && <form className="sts-chat-card" onSubmit={reviewComplaint}>
            <strong>3. Tell us what happened.</strong><p className="sts-chat-muted">Describe the incident in your own words. Include useful details such as when it happened.</p>
            <label className="sts-chat-label" htmlFor="sts-chat-message">Incident details</label>
            <textarea id="sts-chat-message" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} placeholder="What happened?" minLength={10} required rows={4} />
            <label className="sts-chat-label" htmlFor="sts-chat-phone">Phone number <span>(optional if you provide email)</span></label>
            <input id="sts-chat-phone" type="tel" value={form.passenger_phone} onChange={(event) => setForm((current) => ({ ...current, passenger_phone: event.target.value }))} placeholder="e.g. 0712 345 678" />
            <label className="sts-chat-label" htmlFor="sts-chat-email">Email address <span>(optional if you provide phone)</span></label>
            <input id="sts-chat-email" type="email" value={form.passenger_email} onChange={(event) => setForm((current) => ({ ...current, passenger_email: event.target.value }))} placeholder="name@example.com" />
            <button type="submit" className="sts-chat-primary">Review complaint</button>
            <button type="button" className="sts-chat-back" onClick={() => setStep('operator')}>← Back to service details</button>
          </form>}

          {step === 'confirm' && <div className="sts-chat-card"><strong>Please review your complaint</strong><dl className="sts-chat-summary">
            <dt>Service</dt><dd>{serviceLabels[form.service_type]}</dd><dt>Operator</dt><dd>{form.service_name}</dd><dt>{form.service_type === 'school' ? 'Location' : 'Route'}</dt><dd>{form.service_type === 'school' ? form.location : form.route_name}</dd><dt>Incident</dt><dd>{form.message}</dd><dt>Contact</dt><dd>{[form.passenger_phone, form.passenger_email].filter(Boolean).join(' · ')}</dd>
          </dl><button type="button" className="sts-chat-primary" onClick={submitComplaint} disabled={sending}>{sending ? 'Submitting…' : 'Confirm and submit'}</button><button type="button" className="sts-chat-back" onClick={() => setStep('details')} disabled={sending}>← Edit complaint</button></div>}

          {step === 'success' && <div className="sts-chat-success"><span>✓</span><strong>Complaint submitted</strong><p>Your complaint has been sent to the relevant transport administrator.</p><div className="sts-chat-reference">Reference number<b>#{reference}</b></div><button type="button" className="sts-chat-primary" onClick={resetChat}>Submit another complaint</button></div>}

          {error && step !== 'operator' && <p className="sts-chat-error" role="alert">{error}</p>}
        </div>
      </section>}
      <button type="button" className="sts-chat-launcher" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close complaint chat' : 'Open complaint chat'} aria-expanded={open}>
        {open ? <span className="sts-chat-launcher-close" aria-hidden="true">×</span> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-3.5 2v-5.2A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11h8M8 14.5h5" /></svg>}
      </button>
    </div>
  );
}
