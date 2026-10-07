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

export const fetchSaccoAdminOverview = () => request('/api/sacco-admin/overview');
export const fetchSaccoAdminDrivers = () => request('/api/sacco-admin/drivers');
export const approveSaccoDriver = (driverId) => request(`/api/sacco-admin/drivers/${driverId}/approve`, { method: 'POST' });
export const fetchSaccoRoutes = () => request('/api/sacco-admin/routes');
export const createSaccoRoute = (payload) => request('/api/sacco-admin/routes', { method: 'POST', body: payload });
export const fetchSaccoFares = () => request('/api/sacco-admin/fares');
export const saveSaccoFare = (payload) => request('/api/sacco-admin/fares', { method: 'POST', body: payload });
export const fetchSaccoQueue = () => request('/api/sacco-admin/queue');
export const dispatchQueueEntry = (entryId, payload) => request(`/api/sacco-admin/queue/${entryId}/dispatch`, { method: 'POST', body: payload });
export const markQueueEntryLeft = (entryId) => request(`/api/sacco-admin/queue/${entryId}/left`, { method: 'POST' });
export const fetchSchoolRequests = () => request('/api/sacco-admin/school-requests');
export const assignSchoolDrivers = (requestId, payload) => request(`/api/sacco-admin/school-requests/${requestId}/assign`, { method: 'POST', body: payload });
export const fetchSaccoComplaints = () => request('/api/sacco-admin/complaints');
export const respondToComplaint = (complaintId, payload) => request(`/api/sacco-admin/complaints/${complaintId}/respond`, { method: 'POST', body: payload });
export const fetchSaccoRevenueReport = (query = '') => request(`/api/sacco-admin/reports/revenue${query}`);
