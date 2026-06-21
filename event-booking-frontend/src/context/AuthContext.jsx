import React, { createContext, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth'
import * as usersApi from '../api/users'
import { getTokens, setTokens, clearTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tokens = getTokens()
    if (!tokens?.accessToken) {
      setLoading(false)
      return
    }

    usersApi
      .getCurrentUser()
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const tokens = await authApi.login({ email, password })
    setTokens(tokens)
    const me = await usersApi.getCurrentUser()
    setUser(me)
    return me
  }

  async function register(payload) {
    const tokens = await authApi.register(payload)
    setTokens(tokens)
    const me = await usersApi.getCurrentUser()
    setUser(me)
    return me
  }

  function logout() {
    clearTokens()
    setUser(null)
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isOrganizer: user?.role === 'ORGANIZER' || user?.role === 'ADMIN',
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
