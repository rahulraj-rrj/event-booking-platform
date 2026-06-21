import { client } from './client'

export function register(payload) {
  return client.post('/auth/register', payload).then((res) => res.data)
}

export function login(payload) {
  return client.post('/auth/login', payload).then((res) => res.data)
}
