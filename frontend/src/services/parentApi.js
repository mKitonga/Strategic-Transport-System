import { apiRequest as request } from './transportApi';

export const fetchParentChild = () => request('/api/parent/child');
export const fetchParentTrips = () => request('/api/parent/trips');
export const fetchParentPayments = () => request('/api/parent/payments');
export const makeParentPayment = (payload) => request('/api/parent/payments', { method: 'POST', body: payload });
export const fetchParentNotifications = () => request('/api/parent/notifications');
