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

export const fetchBookingComplaints = () => request('/api/booking-admin/complaints');
export const respondToBookingComplaint = (id, payload) => request(`/api/booking-admin/complaints/${id}/respond`, { method: 'POST', body: payload });
export const fetchBookingManifestReport = (query = '') => request(`/api/booking-admin/reports/manifest${query}`);
