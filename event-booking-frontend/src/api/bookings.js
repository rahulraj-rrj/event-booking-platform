import { client } from './client'

export function createBooking(payload) {
  return client.post('/bookings', payload).then((res) => res.data)
}

export function getBooking(id) {
  return client.get(`/bookings/${id}`).then((res) => res.data)
}

export function getMyBookings() {
  return client.get('/bookings/my').then((res) => res.data)
}

export function payForBooking(id) {
  return client.post(`/bookings/${id}/pay`).then((res) => res.data)
}

export function cancelBooking(id) {
  return client.post(`/bookings/${id}/cancel`).then((res) => res.data)
}
