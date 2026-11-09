import { apiRequest as request } from './transportApi';

export const fetchSchoolDriverTrips = () => request('/api/school-driver/trips');
export const fetchSchoolDriverAlerts = () => request('/api/school-driver/alerts');
export const sendSchoolDriverAlert = (payload) => request('/api/school-driver/alerts', { method: 'POST', body: payload });
