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

export function fetchPublicDirectories() {
  return request('/api/directories')
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

export async function fetchRoleDashboardStats(role, user) {
  const { token } = getStoredSession();
  const get = (path) => request(path, { token });
  const count = (items) => (Array.isArray(items) ? items.length : 0);

  if (role === 'sacco_admin') {
    const { stats } = await get('/api/sacco-admin/overview');
    return stats;
  }

  if (role === 'sacco_driver') {
    const { stats } = await get('/api/sacco-driver/overview');
    return stats;
  }

  if (role === 'school_admin') {
    const [drivers, notifications, trips, payments] = await Promise.all([
      get('/api/school-admin/drivers'),
      get('/api/school-admin/notifications'),
      get('/api/school-admin/trips'),
      get('/api/school-admin/payments'),
    ]);
    const publishedTrips = [
      ...(trips.daily_trips || []),
      ...(trips.educational_trips || []),
      ...(trips.closing_trips || []),
    ].filter((trip) => trip.status === 'published');

    return {
      pending_drivers: count(drivers.drivers?.filter((driver) => driver.status === 'pending_approval')),
      published_trips: publishedTrips.length,
      pending_payments: count(payments.payments?.filter((payment) => payment.status === 'submitted')),
      open_alerts: count(notifications.notifications?.filter((notification) => notification.status === 'open')),
    };
  }

  if (role === 'school_driver') {
    const [trips, alerts] = await Promise.all([
      get('/api/school-driver/trips'),
      get('/api/school-driver/alerts'),
    ]);
    return {
      assigned_trips: count(trips.trips),
      assigned_students: (trips.trips || []).reduce((sum, trip) => sum + count(trip.students), 0),
      alerts_sent: count(alerts.alerts),
    };
  }

  if (role === 'parent') {
    const [child, trips, payments] = await Promise.all([
      get('/api/parent/child'),
      get('/api/parent/trips'),
      get('/api/parent/payments'),
    ]);
    const daily = trips.daily_trips || [];
    const educational = trips.educational_trips || [];
    const closing = trips.closing_trips || [];
    const assignedDaily = daily.filter((trip) => trip.assignment);
    const assignedClosing = closing.filter((trip) => trip.assignment);

    return {
      student_profile: child.child?.student_name ? '1' : '0',
      available_trips: daily.length + educational.length + closing.length,
      pending_payments: count(payments.payments?.filter((payment) => payment.status === 'submitted')),
      assignments: assignedDaily.length + assignedClosing.length,
    };
  }

  if (role === 'booking_admin' || role === 'passenger') {
    const companiesResponse = await get('/api/booking/companies');
    const companies = companiesResponse.companies || [];
    const routes = (await Promise.all(companies.map(async (company) => {
      const response = await get(`/api/booking/companies/${encodeURIComponent(company.slug)}`);
      return response.company?.routes || [];
    }))).flat();
    const trips = (await Promise.all(routes.map(async (route) => {
      const response = await get(`/api/booking/routes/${route.id}`);
      return response.route?.trips || [];
    }))).flat();

    if (role === 'passenger') {
      return {
        companies: companies.length,
        routes: routes.length,
        trips: trips.length,
        stored_bookings: 'Not tracked',
      };
    }

    const complaints = await get('/api/booking-admin/complaints');
    return {
      companies: companies.length,
      routes: routes.length,
      trips: trips.length,
      open_complaints: count(complaints.complaints?.filter((complaint) => complaint.status === 'open')),
    };
  }

  if (role === 'booking_driver') {
    const overview = await get(`/api/booking/driver/${encodeURIComponent(user?.id || '')}/overview`);
    const trips = overview.assigned_trips || [];
    return {
      assigned_trips: trips.length,
      passengers: trips.reduce((sum, trip) => sum + count(trip.passengers), 0),
      route_assignments: new Set(trips.map((trip) => trip.route_name).filter(Boolean)).size,
    };
  }

  return {};
}
