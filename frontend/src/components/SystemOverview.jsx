export default function SystemOverview({ overview, loading, error }) {
  const homepageLinks = overview?.homepage_links ?? []
  const commonFields = overview?.common_registration_fields ?? []
  const roles = overview?.roles ?? []
  const concepts = overview?.concepts ?? []

  return (
    <>
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">{overview?.system_name || 'Strategic Transport System'}</p>
          <h1>Everything any user should access from the homepage.</h1>
          <p className="intro">
            This homepage now follows your image directly: public links first,
            then the authentication requirements for the five roles.
          </p>
        </div>
      </section>

      <section className="surface-grid homepage-grid">
        <article className="panel panel-wide">
          <div className="panel-heading">
            <p className="eyebrow">Homepage</p>
            <h2>Any user should be able to access the following</h2>
          </div>
          <div className="homepage-link-list">
            {homepageLinks.map((item) => (
              <div className="homepage-link-item" key={item}>
                <span className="arrow-mark">-&gt;</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Authentication</p>
            <h2>All users first enter the common fields below</h2>
          </div>
          <div className="field-strip">
            {commonFields.map((field) => (
              <span className="field-pill" key={field}>
                {field}
              </span>
            ))}
          </div>
          <div className="phase-note">
            <p>{overview?.deferred_note}</p>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Role Fields</p>
          <h2>Role-specific fields after selecting a role</h2>
        </div>
        <div className="auth-role-grid">
          {roles.map((role) => (
            <article className="role-card compact" key={role.key}>
              <div className="role-card-top">
                <h3>{role.label}</h3>
              </div>
              <ul className="bullet-list">
                {role.fields.map((field) => (
                  <li key={`${role.key}-${field.key}`}>{field.label}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-grid homepage-grid">
        <article className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Key Concepts</p>
            <h2>Notes carried from the requirement sheet</h2>
          </div>
          <ul className="bullet-list">
            {concepts.map((concept) => (
              <li key={concept}>{concept}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Status</p>
            <h2>Public homepage data</h2>
          </div>
          <div className="stats-grid phase-stats">
            <article className="stat-card">
              <span className="label">Homepage</span>
              <strong className={error ? 'status error' : 'status success'}>
                {loading ? 'Loading' : error ? 'Check backend' : 'Ready'}
              </strong>
              <p>{error || 'Homepage data is loading from the public controller.'}</p>
            </article>
            <article className="stat-card">
              <span className="label">Roles Enabled</span>
              <strong>{roles.length || 5}</strong>
              <p>Only the five roles in your image are active in this step.</p>
            </article>
          </div>
        </article>
      </section>
    </>
  )
}
