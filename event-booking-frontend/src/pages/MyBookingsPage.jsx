import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TicketX } from 'lucide-react'
import { getMyBookings } from '../api/bookings'
import TicketStub from '../components/TicketStub'
import Skeleton from '../components/Skeleton'

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyBookings()
      .then(setBookings)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page container">
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>My bookings</h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} height="140px" radius="16px" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <TicketX style={{ margin: '0 auto' }} />
          <p>
            No bookings yet. <Link to="/" className="muted-link">Browse events</Link> to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {bookings.map((booking, i) => (
            <Link
              key={booking.id}
              to={`/bookings/${booking.id}`}
              className="fade-in-up"
              style={{ display: 'block', animationDelay: `${i * 50}ms` }}
            >
              <TicketStub booking={booking} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
