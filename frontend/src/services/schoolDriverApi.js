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

export const fetchSchoolDriverTrips = () => request('/api/school-driver/trips');
export const fetchSchoolDriverAlerts = () => request('/api/school-driver/alerts');
export const sendSchoolDriverAlert = (payload) => request('/api/school-driver/alerts', { method: 'POST', body: payload });
