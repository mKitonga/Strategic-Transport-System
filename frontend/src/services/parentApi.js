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

export const fetchParentChild = () => request('/api/parent/child');
export const fetchParentTrips = () => request('/api/parent/trips');
export const fetchParentPayments = () => request('/api/parent/payments');
export const makeParentPayment = (payload) => request('/api/parent/payments', { method: 'POST', body: payload });
export const fetchParentNotifications = () => request('/api/parent/notifications');
