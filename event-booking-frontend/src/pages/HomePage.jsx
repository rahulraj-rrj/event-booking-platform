import React, { useEffect, useState } from 'react'
import { Search, Sparkles, CalendarX } from 'lucide-react'
import { searchEvents } from '../api/events'
import EventCard from '../components/EventCard'
import Skeleton from '../components/Skeleton'
import Banner from '../components/Banner'
import './HomePage.css'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'music', label: 'Music' },
  { value: 'theatre', label: 'Theatre' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'sports', label: 'Sports' },
  { value: 'conference', label: 'Conference' },
]

function CardSkeleton() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <Skeleton height="92px" radius="0" />
      <div style={{ padding: '16px 18px 18px' }}>
        <Skeleton height="18px" width="80%" style={{ marginBottom: 14 }} />
        <Skeleton height="12px" width="60%" style={{ marginBottom: 8 }} />
        <Skeleton height="12px" width="45%" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const [data, setData] = useState({ content: [], page: 0, totalPages: 1 })
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    searchEvents({ keyword: keyword || undefined, category: category || undefined, page, size: 9 })
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load events. Is the backend running?')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [keyword, category, page])

  function handleSearchChange(value) {
    setPage(0)
    setKeyword(value)
  }

  function handleCategoryChange(value) {
    setPage(0)
    setCategory(value)
  }

  return (
    <div className="page container">
      <div className="hero">
        <span className="hero-eyebrow">
          <Sparkles size={12} /> Now booking
        </span>
        <h1 className="hero-title">
          Find your next <em>night out</em>
        </h1>
        <p className="hero-subtitle">
          Live music, theatre, comedy, and more — pick your seats and book in seconds.
        </p>

        <div className="search-bar">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search by event name…"
            value={keyword}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="category-pills">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={`category-pill ${category === c.value ? 'active' : ''}`}
              onClick={() => handleCategoryChange(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {error && <Banner type="error">{error}</Banner>}

      {loading ? (
        <div className="event-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : data.content.length === 0 ? (
        <div className="empty-state">
          <CalendarX style={{ margin: '0 auto' }} />
          <p>No events match your search yet — try a different category or check back soon.</p>
        </div>
      ) : (
        <>
          <div className="event-grid">
            {data.content.map((event, i) => (
              <div key={event.id} className="fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                <EventCard event={event} />
              </div>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-ghost"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                ← Prev
              </button>
              <span>
                Page {data.page + 1} of {Math.max(1, data.totalPages)}
              </span>
              <button
                className="btn btn-ghost"
                disabled={page + 1 >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
