import { apiRequest as request } from './transportApi'

export const fetchBookingCompanies = () => request('/api/booking/companies')
export const fetchBookingCompany = (slug) => request(`/api/booking/companies/${slug}`)
export const fetchBookingRoute = (routeId) => request(`/api/booking/routes/${routeId}`)
export const fetchBookingTrip = (tripId) => request(`/api/booking/trips/${tripId}`)
export const bookBookingTrip = (tripId, payload) =>
  request(`/api/booking/trips/${tripId}/book`, { method: 'POST', body: payload })
export const fetchDriverOverview = (driverId) =>
  request(`/api/booking/driver/${driverId}/overview`)
export const notifyDriverArrival = (tripId, payload) =>
  request(`/api/booking/trips/${tripId}/notify-arrival`, { method: 'POST', body: payload })
