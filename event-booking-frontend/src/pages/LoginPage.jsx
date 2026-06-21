import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthDecor from '../components/AuthDecor'
import Banner from '../components/Banner'
import './Auth.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      const redirectTo = location.state?.from?.pathname || '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <AuthDecor
        eyebrow="Welcome back"
        title={<>Your seats are <em>right where</em> you left them</>}
        subtitle="Log in to manage bookings, pay for reservations, and find your next show."
      />

      <div className="auth-form-side">
        <div className="auth-card">
          <h1 className="auth-title">Log in</h1>
          <p className="auth-subtitle">Book seats and manage your tickets.</p>

          {error && <Banner type="error">{error}</Banner>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              <LogIn size={16} /> {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <div className="auth-footer">
            New here? <Link to="/register" className="muted-link">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
