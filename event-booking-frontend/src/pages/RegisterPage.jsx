import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthDecor from '../components/AuthDecor'
import Banner from '../components/Banner'
import './Auth.css'

const initialForm = { name: '', email: '', password: '', role: 'USER' }

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create your account')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <AuthDecor
        eyebrow="Get started"
        title={<>Front row seats are <em>just a click</em> away</>}
        subtitle="Sign up to book tickets, or register as an organizer to run your own events."
      />

      <div className="auth-form-side">
        <div className="auth-card">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Takes less than a minute.</p>

          {error && <Banner type="error">{error}</Banner>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" required value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="role">Account type</label>
              <select id="role" value={form.role} onChange={(e) => update('role', e.target.value)}>
                <option value="USER">Attendee — I want to book tickets</option>
                <option value="ORGANIZER">Organizer — I want to create events</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              <UserPlus size={16} /> {submitting ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login" className="muted-link">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
