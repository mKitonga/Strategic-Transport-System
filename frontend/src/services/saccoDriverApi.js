import { apiRequest as request } from './transportApi';

export const fetchSaccoDriverOverview = () => request('/api/sacco-driver/overview');
export const fetchArrivalStatus = () => request('/api/sacco-driver/arrival-status');
export const notifyArrival = (payload) => request('/api/sacco-driver/arrival-notify', { method: 'POST', body: payload });
export const fetchDriverFares = () => request('/api/sacco-driver/fares');
export const createFarePrompt = (payload) => request('/api/sacco-driver/fare-prompts', { method: 'POST', body: payload });
export const fetchDriverDropoffs = () => request('/api/sacco-driver/dropoffs');
export const clearDriverDropoff = (paymentId) => request(`/api/sacco-driver/dropoffs/${paymentId}/clear`, { method: 'POST' });
export const fetchDriverSchoolTransport = () => request('/api/sacco-driver/school-transport');
export const sendDriverSchoolUpdate = (payload) => request('/api/sacco-driver/school-updates', { method: 'POST', body: payload });
