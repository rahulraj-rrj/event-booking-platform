import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const client = axios.create({ baseURL: BASE_URL })

function getTokens() {
  const raw = localStorage.getItem('encore_tokens')
  return raw ? JSON.parse(raw) : null
}

function setTokens(tokens) {
  localStorage.setItem('encore_tokens', JSON.stringify(tokens))
}

function clearTokens() {
  localStorage.removeItem('encore_tokens')
}

client.interceptors.request.use((config) => {
  const tokens = getTokens()
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`
  }
  return config
})

// If a request comes back 401 (expired access token), try refreshing once
// and replay the original request - this is what keeps a 15 minute access
// token from logging the user out every quarter hour.
let refreshPromise = null

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const tokens = getTokens()

      if (!tokens?.refreshToken) {
        clearTokens()
        return Promise.reject(error)
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${BASE_URL}/auth/refresh`, { refreshToken: tokens.refreshToken })
            .finally(() => {
              refreshPromise = null
            })
        }
        const { data } = await refreshPromise
        setTokens(data)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return client(originalRequest)
      } catch (refreshError) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export { client, getTokens, setTokens, clearTokens }
