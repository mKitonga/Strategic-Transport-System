import { apiRequest as request } from './transportApi';

export const fetchBookingComplaints = () => request('/api/booking-admin/complaints');
export const fetchBookingDrivers = () => request('/api/booking-admin/drivers');
export const approveBookingDriver = (driverId) => request(`/api/booking-admin/drivers/${driverId}/approve`, { method: 'POST' });
export const fetchBookingRoutes = () => request('/api/booking-admin/routes');
export const createBookingRoute = (payload) => request('/api/booking-admin/routes', { method: 'POST', body: payload });
export const respondToBookingComplaint = (id, payload) => request(`/api/booking-admin/complaints/${id}/respond`, { method: 'POST', body: payload });
export const fetchBookingManifestReport = (query = '') => request(`/api/booking-admin/reports/manifest${query}`);
