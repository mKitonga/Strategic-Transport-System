import { useEffect, useState } from 'react'
import { loginUser, registerUser } from '../services/transportApi'

const registerDefaults = {
  name: '',
  phone: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: '',
  profile_data: {},
}

export default function AuthPanel({ roles, onAuthenticated }) {
  const [mode, setMode] = useState('register')
  const [registerForm, setRegisterForm] = useState(registerDefaults)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!registerForm.role && roles.length > 0) {
      setRegisterForm((current) => ({
        ...current,
        role: roles[0].key,
      }))
    }
  }, [registerForm.role, roles])

  const selectedRole =
    roles.find((role) => role.key === registerForm.role) ?? roles[0] ?? null

  const handleRegisterChange = (event) => {
    const { name, value } = event.target

    if (name.startsWith('profile_data.')) {
      const fieldKey = name.replace('profile_data.', '')

      setRegisterForm((current) => ({
        ...current,
        profile_data: {
          ...current.profile_data,
          [fieldKey]: value,
        },
      }))

      return
    }

    setRegisterForm((current) => ({
      ...current,
      [name]: value,
      profile_data: name === 'role' ? {} : current.profile_data,
    }))
  }

  const handleLoginChange = (event) => {
    const { name, value } = event.target

    setLoginForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setFeedback('')

    try {
      const response = await registerUser(registerForm)
      onAuthenticated(response)
      setFeedback('Account created and signed in successfully.')
      setRegisterForm(registerDefaults)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setFeedback('')

    try {
      const response = await loginUser(loginForm)
      onAuthenticated(response)
      setFeedback('Login successful.')
      setLoginForm({ email: '', password: '' })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel auth-panel">
      <div className="panel-heading">
        <p className="eyebrow">Authentication</p>
        <h2>Register or login using the roles from the homepage requirements</h2>
      </div>

      <p className="panel-copy">
        This auth section covers only SACCO admin, SACCO driver, school admin,
        school driver, and parent. Booking authentication comes later.
      </p>

      <div className="segmented-control" role="tablist" aria-label="Auth mode">
        <button
          className={mode === 'register' ? 'segment active' : 'segment'}
          onClick={() => setMode('register')}
          type="button"
        >
          Register
        </button>
        <button
          className={mode === 'login' ? 'segment active' : 'segment'}
          onClick={() => setMode('login')}
          type="button"
        >
          Login
        </button>
      </div>

      {mode === 'register' ? (
        <form className="auth-form" onSubmit={handleRegister}>
          <div className="input-grid">
            <label className="field">
              <span>Full name</span>
              <input
                name="name"
                onChange={handleRegisterChange}
                placeholder="Enter full name"
                required
                value={registerForm.name}
              />
            </label>

            <label className="field">
              <span>Phone number</span>
              <input
                name="phone"
                onChange={handleRegisterChange}
                placeholder="e.g. 0712345678"
                required
                value={registerForm.phone}
              />
            </label>

            <label className="field">
              <span>Email address</span>
              <input
                name="email"
                onChange={handleRegisterChange}
                placeholder="name@example.com"
                required
                type="email"
                value={registerForm.email}
              />
            </label>

            <label className="field">
              <span>Role</span>
              <select
                name="role"
                onChange={handleRegisterChange}
                required
                value={registerForm.role}
              >
                {roles.map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Password</span>
              <input
                name="password"
                onChange={handleRegisterChange}
                required
                type="password"
                value={registerForm.password}
              />
            </label>

            <label className="field">
              <span>Confirm password</span>
              <input
                name="password_confirmation"
                onChange={handleRegisterChange}
                required
                type="password"
                value={registerForm.password_confirmation}
              />
            </label>
          </div>

          <div className="role-preview">
            <div>
              <p className="eyebrow">Selected role</p>
              <h3>{selectedRole?.label ?? 'Choose a role'}</h3>
              <p>Complete the fields shown for the selected role.</p>
            </div>
            <div className="role-tags">
              {(selectedRole?.fields ?? []).map((field) => (
                <span key={field.key} className="field-pill">
                  {field.label}
                </span>
              ))}
            </div>
          </div>

          {(selectedRole?.fields ?? []).length > 0 && (
            <div className="input-grid extra-fields">
              {selectedRole.fields.map((field) => (
                <label className="field" key={field.key}>
                  <span>{field.label}</span>
                  <input
                    name={`profile_data.${field.key}`}
                    onChange={handleRegisterChange}
                    required
                    value={registerForm.profile_data[field.key] ?? ''}
                  />
                </label>
              ))}
            </div>
          )}

          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="input-grid compact-grid">
            <label className="field">
              <span>Email address</span>
              <input
                name="email"
                onChange={handleLoginChange}
                required
                type="email"
                value={loginForm.email}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                name="password"
                onChange={handleLoginChange}
                required
                type="password"
                value={loginForm.password}
              />
            </label>
          </div>

          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? 'Signing in...' : 'Login'}
          </button>
        </form>
      )}

      {feedback ? <p className="feedback success">{feedback}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}
    </section>
  )
}
