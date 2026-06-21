import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import { getVenues } from '../api/venues'
import { createEvent } from '../api/events'
import Banner from '../components/Banner'

const initialForm = {
  title: '',
  description: '',
  category: 'music',
  venueId: '',
  startTime: '',
  endTime: '',
  basePrice: '',
}

export default function CreateEventPage() {
  const navigate = useNavigate()
  const [venues, setVenues] = useState([])
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getVenues().then(setVenues).catch(() => setError('Could not load venues.'))
  }, [])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const event = await createEvent({
        ...form,
        basePrice: Number(form.basePrice),
      })
      navigate(`/events/${event.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the event.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page container" style={{ maxWidth: 540 }}>
      <h1 style={{ fontSize: 28, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
        <CalendarPlus size={24} color="var(--gold)" /> Create an event
      </h1>
      <p style={{ marginBottom: 24 }}>
        Need a new venue first? Venues are managed by admins — use the Swagger UI
        (<code>/swagger-ui/index.html</code>) to add one, then it'll show up here.
      </p>

      {error && <Banner type="error">{error}</Banner>}

      <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" required value={form.title} onChange={(e) => update('title', e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" value={form.category} onChange={(e) => update('category', e.target.value)}>
            <option value="music">Music</option>
            <option value="theatre">Theatre</option>
            <option value="comedy">Comedy</option>
            <option value="sports">Sports</option>
            <option value="conference">Conference</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="venue">Venue</label>
          <select id="venue" required value={form.venueId} onChange={(e) => update('venueId', e.target.value)}>
            <option value="" disabled>
              Select a venue…
            </option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="startTime">Start time</label>
          <input
            id="startTime"
            type="datetime-local"
            required
            value={form.startTime}
            onChange={(e) => update('startTime', e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="endTime">End time</label>
          <input
            id="endTime"
            type="datetime-local"
            required
            value={form.endTime}
            onChange={(e) => update('endTime', e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="basePrice">Base ticket price (₹)</label>
          <input
            id="basePrice"
            type="number"
            min="1"
            step="0.01"
            required
            value={form.basePrice}
            onChange={(e) => update('basePrice', e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create event'}
        </button>
      </form>
    </div>
  )
}
