import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Calendar, MapPin, Armchair, Map as MapIcon } from 'lucide-react'
import { getEvent, getEventSeats } from '../api/events'
import { getVenue } from '../api/venues'
import { createBooking } from '../api/bookings'
import { useAuth } from '../context/AuthContext'
import SeatMap from '../components/SeatMap'
import VenueMap from '../components/VenueMap'
import Skeleton from '../components/Skeleton'
import Banner from '../components/Banner'
import './EventDetailPage.css'

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [event, setEvent] = useState(null)
  const [venue, setVenue] = useState(null)
  const [seats, setSeats] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    let cancelled = false

    Promise.all([getEvent(id), getEventSeats(id)])
      .then(([eventData, seatData]) => {
        if (cancelled) return
        setEvent(eventData)
        setSeats(seatData)
        return getVenue(eventData.venueId)
      })
      .then((venueData) => {
        if (!cancelled && venueData) setVenue(venueData)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this event.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  function toggleSeat(seat) {
    setSelectedIds((prev) =>
      prev.includes(seat.id) ? prev.filter((sid) => sid !== seat.id) : [...prev, seat.id]
    )
  }

  const selectedSeats = seats.filter((s) => selectedIds.includes(s.id))
  const total = selectedSeats.reduce((sum, s) => sum + Number(s.price), 0)

  async function handleBook() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } })
      return
    }
    setError('')
    setBooking(true)
    try {
      const result = await createBooking({ eventId: id, eventSeatIds: selectedIds })
      navigate(`/bookings/${result.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete the booking. Please try again.')
      getEventSeats(id).then(setSeats)
      setSelectedIds([])
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="page container">
        <Skeleton height="22px" width="120px" style={{ marginBottom: 14 }} />
        <Skeleton height="38px" width="60%" style={{ marginBottom: 12 }} />
        <Skeleton height="16px" width="40%" style={{ marginBottom: 32 }} />
        <Skeleton height="320px" radius="16px" />
      </div>
    )
  }
  if (!event) return <div className="page container"><Banner type="error">{error || 'Event not found.'}</Banner></div>

  return (
    <div className="page container">
      <div className="event-detail-header">
        <span className="event-detail-category">{event.category}</span>
        <h1 className="event-detail-title">{event.title}</h1>
        <div className="event-detail-meta">
          <span className="event-detail-meta-row">
            <Calendar size={15} /> {formatDate(event.startTime)}
          </span>
          <span className="event-detail-meta-row">
            <MapPin size={15} /> {event.venueName}
          </span>
        </div>
        {event.description && <p className="event-detail-description">{event.description}</p>}
      </div>

      <div className="event-detail-layout">
        <div>
          <h3 className="section-heading"><Armchair size={17} /> Select your seats</h3>
          <SeatMap seats={seats} selectedIds={selectedIds} onToggle={toggleSeat} />

          {venue && (
            <div style={{ marginTop: 28 }}>
              <h3 className="section-heading"><MapIcon size={17} /> Venue location</h3>
              <VenueMap latitude={venue.latitude} longitude={venue.longitude} label={venue.name} />
            </div>
          )}
        </div>

        <div className="card booking-panel">
          <h3 style={{ marginBottom: 16 }}>Your selection</h3>

          {error && <Banner type="error">{error}</Banner>}

          {selectedSeats.length === 0 ? (
            <p>Pick a seat from the map to get started.</p>
          ) : (
            selectedSeats.map((s) => (
              <div className="booking-panel-row" key={s.id}>
                <span>
                  Seat {s.seatNumber} ({s.seatType})
                </span>
                <span>₹{s.price}</span>
              </div>
            ))
          )}

          <div className="booking-panel-total">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>

          <button
            className="btn btn-primary btn-block"
            disabled={selectedIds.length === 0 || booking}
            onClick={handleBook}
          >
            {booking ? 'Reserving…' : isAuthenticated ? 'Reserve seats' : 'Log in to book'}
          </button>
        </div>
      </div>
    </div>
  )
}
