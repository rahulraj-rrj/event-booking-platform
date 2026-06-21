import { client } from './client'

export function getVenues() {
  return client.get('/venues').then((res) => res.data)
}

export function getVenue(id) {
  return client.get(`/venues/${id}`).then((res) => res.data)
}
