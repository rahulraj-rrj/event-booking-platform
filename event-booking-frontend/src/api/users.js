import { client } from './client'

export function getCurrentUser() {
  return client.get('/users/me').then((res) => res.data)
}
