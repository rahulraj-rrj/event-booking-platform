import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { LocateFixed, CalendarX } from 'lucide-react'
import { getNearbyEvents } from '../api/events'
import EventCard from '../components/EventCard'
import Skeleton from '../components/Skeleton'
import Banner from '../components/Banner'
import './HomePage.css'

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export default function NearbyEventsPage() {
  const [position, setPosition] = useState(null)
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('locating')
  const [radiusKm, setRadiusKm] = useState(25)

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('error')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => setStatus('error'),
      { timeout: 8000 }
    )
  }, [])

  useEffect(() => {
    if (!position) return
    setStatus('loading')
    getNearbyEvents(position.lat, position.lng, radiusKm)
      .then((res) => {
        setResults(res)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [position, radiusKm])

  return (
    <div className="page container">
      <div className="hero" style={{ paddingTop: 40 }}>
        <span className="hero-eyebrow">
          <LocateFixed size={12} /> Location-based
        </span>
        <h1 className="hero-title">Events near you</h1>
        <p className="hero-subtitle">Distance calculated to each venue, closest first.</p>
      </div>

      {status === 'locating' && (
        <div className="loading-state">Finding your location…</div>
      )}

      {status === 'error' && (
        <Banner type="error">
          Couldn't get your location. Make sure location access is allowed for this site.
        </Banner>
      )}

      {position && (
        <>
          <div className="category-pills">
            {[5, 25, 100, 500].map((r) => (
              <button
                key={r}
                className={`category-pill ${radiusKm === r ? 'active' : ''}`}
                onClick={() => setRadiusKm(r)}
              >
                Within {r} km
              </button>
            ))}
          </div>

          <div className="venue-map" style={{ marginBottom: 28 }}>
            <MapContainer center={[position.lat, position.lng]} zoom={9} style={{ height: '320px', width: '100%' }}>
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[position.lat, position.lng]} icon={markerIcon}>
                <Popup>You are here</Popup>
              </Marker>
            </MapContainer>
          </div>

          {status === 'loading' ? (
            <div className="event-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height="220px" radius="16px" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <CalendarX style={{ margin: '0 auto' }} />
              <p>No events within {radiusKm} km. Try a wider radius.</p>
            </div>
          ) : (
            <div className="event-grid">
              {results.map(({ event, distanceKm }, i) => (
                <div key={event.id} className="fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <EventCard event={event} distanceKm={distanceKm} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
