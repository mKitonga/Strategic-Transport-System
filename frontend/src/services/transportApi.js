const API_BASE = ''
const TOKEN_KEY = 'strategic_transport_token'
const USER_KEY = 'strategic_transport_user'

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {
    Accept: 'application/json',
  }

  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed with status ${response.status}`,
    )
  }

  return data
}

export function getStoredSession() {
  const token = window.localStorage.getItem(TOKEN_KEY)
  const user = window.localStorage.getItem(USER_KEY)

  return {
    token,
    user: user ? JSON.parse(user) : null,
  }
}

export function storeSession(token, user) {
  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearStoredSession() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

export function fetchHomepage() {
  return request('/api/homepage')
}

export function registerUser(payload) {
  return request('/api/auth/register', {
    method: 'POST',
    body: payload,
  })
}

export function loginUser(payload) {
  return request('/api/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export function fetchCurrentUser(token) {
  return request('/api/auth/me', {
    token,
  })
}

export function logoutUser(token) {
  return request('/api/auth/logout', {
    method: 'POST',
    token,
  })
}

export function requestPasswordReset(payload) {
  return request('/api/auth/forgot-password', {
    method: 'POST',
    body: payload,
  })
}

export function resetPassword(payload) {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: payload,
  })
}

export function fetchDriverActivityReport(query = '') {
  const { token } = getStoredSession();
  return request(`/api/reports/driver-activity${query}`, { token });
}

export function fetchUserActivityReport(query = '') {
  const { token } = getStoredSession();
  return request(`/api/reports/user-activity${query}`, { token });
}

export function fetchSaccoRevenueReport(query = '') {
  const { token } = getStoredSession();
  return request(`/api/sacco-admin/reports/revenue${query}`, { token });
}

export function fetchSchoolPaymentsReport(query = '') {
  const { token } = getStoredSession();
  return request(`/api/school-admin/reports/payments${query}`, { token });
}

export function fetchBookingManifestReport(query = '') {
  const { token } = getStoredSession();
  return request(`/api/booking-admin/reports/manifest${query}`, { token });
}
