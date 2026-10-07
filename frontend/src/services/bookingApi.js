async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`)
  }

  return data
}

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
