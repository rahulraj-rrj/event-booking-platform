import { client } from './client'

export function searchEvents(params) {
  return client.get('/events', { params }).then((res) => res.data)
}

export function getEvent(id) {
  return client.get(`/events/${id}`).then((res) => res.data)
}

export function getEventSeats(id) {
  return client.get(`/events/${id}/seats`).then((res) => res.data)
}

export function getNearbyEvents(lat, lng, radiusKm = 25) {
  return client.get('/events/nearby', { params: { lat, lng, radiusKm } }).then((res) => res.data)
}

export function createEvent(payload) {
  return client.post('/events', payload).then((res) => res.data)
}
