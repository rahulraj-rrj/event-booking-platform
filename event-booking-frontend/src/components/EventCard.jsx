import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Navigation } from 'lucide-react'
import './EventCard.css'

const CATEGORY_STYLES = {
  music: { from: '#7F3FA0', to: '#D4537E' },
  theatre: { from: '#993C1D', to: '#D85A30' },
  comedy: { from: '#854F0B', to: '#EF9F27' },
  sports: { from: '#0F6E56', to: '#2EB38F' },
  conference: { from: '#185FA5', to: '#378ADD' },
}
const DEFAULT_STYLE = { from: '#3C3489', to: '#7F77DD' }

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function EventCard({ event, distanceKm }) {
  const style = CATEGORY_STYLES[event.category?.toLowerCase()] || DEFAULT_STYLE

  return (
    <Link to={`/events/${event.id}`} className="event-card card">
      <div
        className="event-card-banner"
        style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}
      >
        <span className="event-card-category">{event.category}</span>
      </div>

      <div className="event-card-body">
        <h3 className="event-card-title">{event.title}</h3>

        <div className="event-card-meta">
          <span className="event-card-meta-row">
            <Calendar size={13} /> {formatDate(event.startTime)}
          </span>
          <span className="event-card-meta-row">
            <MapPin size={13} /> {event.venueName}
          </span>
        </div>

        {typeof distanceKm === 'number' && (
          <div className="event-card-distance">
            <Navigation size={12} /> {distanceKm.toFixed(1)} km away
          </div>
        )}
      </div>
    </Link>
  )
}
