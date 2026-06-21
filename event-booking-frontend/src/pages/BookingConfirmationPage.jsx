import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { getBooking, payForBooking, cancelBooking } from '../api/bookings'
import TicketStub from '../components/TicketStub'
import Skeleton from '../components/Skeleton'
import Banner from '../components/Banner'
import './BookingConfirmationPage.css'

const STATUS_ICON = {
  CONFIRMED: CheckCircle2,
  PENDING: Clock,
  CANCELLED: XCircle,
}

export default function BookingConfirmationPage() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  function load() {
    return getBooking(id)
      .then(setBooking)
      .catch(() => setError('Could not load this booking.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handlePay() {
    setActionLoading(true)
    setError('')
    try {
      const updated = await payForBooking(id)
      setBooking(updated)
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    setActionLoading(true)
    setError('')
    try {
      const updated = await cancelBooking(id)
      setBooking(updated)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel this booking.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page container booking-page">
        <Skeleton height="56px" width="56px" radius="50%" style={{ marginBottom: 18 }} />
        <Skeleton height="28px" width="60%" style={{ marginBottom: 10 }} />
        <Skeleton height="16px" width="80%" style={{ marginBottom: 28 }} />
        <Skeleton height="160px" radius="16px" />
      </div>
    )
  }
  if (!booking) return <div className="page container"><Banner type="error">{error || 'Booking not found.'}</Banner></div>

  const StatusIcon = STATUS_ICON[booking.status] || Clock
  const iconClass = `booking-status-icon-${booking.status.toLowerCase()}`

  return (
    <div className="page container booking-page">
      <div className={`booking-status-icon ${iconClass}`}>
        <StatusIcon size={26} />
      </div>

      <h1 className="booking-page-title">
        {booking.status === 'CONFIRMED' && "You're going!"}
        {booking.status === 'PENDING' && 'Almost there'}
        {booking.status === 'CANCELLED' && 'Booking cancelled'}
      </h1>
      <p className="booking-page-subtitle">
        {booking.status === 'PENDING' && 'Your seats are reserved — complete payment to lock them in.'}
        {booking.status === 'CONFIRMED' && 'Your booking is confirmed. See you there.'}
        {booking.status === 'CANCELLED' && 'This booking was cancelled and the seats were released.'}
      </p>

      {error && <Banner type="error">{error}</Banner>}

      <TicketStub booking={booking}>
        {booking.status === 'PENDING' && (
          <>
            <button className="btn btn-primary" onClick={handlePay} disabled={actionLoading}>
              {actionLoading ? 'Processing…' : 'Pay now (mock)'}
            </button>
            <button className="btn btn-danger" onClick={handleCancel} disabled={actionLoading}>
              Cancel
            </button>
          </>
        )}
        {booking.status === 'CONFIRMED' && (
          <button className="btn btn-danger" onClick={handleCancel} disabled={actionLoading}>
            Cancel booking
          </button>
        )}
      </TicketStub>
    </div>
  )
}
