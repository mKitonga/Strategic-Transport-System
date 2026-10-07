import { getStoredSession } from './transportApi';

async function request(path, { method = 'GET', body } = {}) {
  const { token } = getStoredSession();
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

export const fetchSchoolAdminDrivers = () => request('/api/school-admin/drivers');
export const approveSchoolDriver = (driverId) => request(`/api/school-admin/drivers/${driverId}/approve`, { method: 'POST' });
export const fetchSchoolAdminNotifications = () => request('/api/school-admin/notifications');
export const fetchSchoolAdminTrips = () => request('/api/school-admin/trips');
export const createSchoolRoute = (payload) => request('/api/school-admin/routes', { method: 'POST', body: payload });
export const createDailyTrip = (payload) => request('/api/school-admin/daily-trips', { method: 'POST', body: payload });
export const assignDailyTripStudents = (tripId, payload) => request(`/api/school-admin/daily-trips/${tripId}/assign`, { method: 'POST', body: payload });
export const createEducationalTrip = (payload) => request('/api/school-admin/educational-trips', { method: 'POST', body: payload });
export const createClosingTrip = (payload) => request('/api/school-admin/closing-trips', { method: 'POST', body: payload });
export const saveClosingTripFare = (tripId, payload) => request(`/api/school-admin/closing-trips/${tripId}/fares`, { method: 'POST', body: payload });
export const fetchClosingAssignments = () => request('/api/school-admin/closing-assignments');
export const assignClosingTripStudents = (tripId, payload) => request(`/api/school-admin/closing-trips/${tripId}/assign`, { method: 'POST', body: payload });
export const fetchSchoolPayments = () => request('/api/school-admin/payments');
export const approveSchoolPayment = (paymentId) => request(`/api/school-admin/payments/${paymentId}/approve`, { method: 'POST' });
export const fetchSaccoDirectory = (query = '') => request(`/api/school-admin/sacco-directory${query ? `?q=${encodeURIComponent(query)}` : ''}`);
export const createSchoolSaccoRequest = (payload) => request('/api/school-admin/sacco-requests', { method: 'POST', body: payload });
export const sendSchoolSaccoMessage = (payload) => request('/api/school-admin/sacco-messages', { method: 'POST', body: payload });
export const fetchSchoolComplaints = () => request('/api/school-admin/complaints');
export const respondToSchoolComplaint = (id, payload) => request(`/api/school-admin/complaints/${id}/respond`, { method: 'POST', body: payload });
export const fetchSchoolPaymentsReport = (query = '') => request(`/api/school-admin/reports/payments${query}`);
