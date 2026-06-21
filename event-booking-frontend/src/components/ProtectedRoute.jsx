import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requireOrganizer = false }) {
  const { isAuthenticated, isOrganizer, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="loading-state">Loading…</div>

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireOrganizer && !isOrganizer) {
    return <Navigate to="/" replace />
  }

  return children
}
