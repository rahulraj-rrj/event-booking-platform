import React from 'react'
import { Ticket } from 'lucide-react'
import './TicketStub.css'

const STATUS_LABEL = {
  PENDING: 'Pending payment',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function TicketStub({ booking, children }) {
  const statusClass = booking.status.toLowerCase()

  return (
    <div className="ticket">
      <div className={`ticket-status-edge ticket-status-edge-${statusClass}`} />

      <div className="ticket-main">
        <div className="ticket-header">
          <span className={`badge badge-${statusClass}`}>
            {STATUS_LABEL[booking.status] || booking.status}
          </span>
          <span className="ticket-amount">₹{booking.totalAmount}</span>
        </div>

        <h3 className="ticket-title">{booking.eventTitle}</h3>

        <div className="ticket-seats">
          {booking.seats.map((seat) => (
            <span key={seat.seatNumber} className="ticket-seat-chip">
              {seat.seatNumber}
            </span>
          ))}
        </div>

        {children && <div className="ticket-actions">{children}</div>}
      </div>

      <div className="ticket-divider">
        <span className="ticket-notch ticket-notch-top" />
        <span className="ticket-notch ticket-notch-bottom" />
      </div>

      <div className="ticket-stub">
        <Ticket size={14} color="var(--gold)" style={{ marginBottom: 10 }} />
        <span className="ticket-stub-label">Booking</span>
        <span className="ticket-stub-id">{booking.id.slice(0, 8).toUpperCase()}</span>
        <span className="ticket-stub-label" style={{ marginTop: 12 }}>Booked</span>
        <span className="ticket-stub-date">{formatDate(booking.bookingTime)}</span>
      </div>
    </div>
  )
}
