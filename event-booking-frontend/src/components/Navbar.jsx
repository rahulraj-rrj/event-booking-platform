import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ticket, MapPin, CalendarPlus, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { isAuthenticated, isOrganizer, user, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleLogout() {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <Ticket className="navbar-brand-icon" strokeWidth={2.2} />
          Encore
        </Link>

        <nav className="navbar-links">
          <Link to="/" className="muted-link">Browse</Link>
          <Link to="/nearby" className="muted-link navbar-link-icon">
            <MapPin size={14} /> Near me
          </Link>
          {isAuthenticated && <Link to="/my-bookings" className="muted-link">My bookings</Link>}
          {isOrganizer && (
            <Link to="/organizer/new-event" className="muted-link navbar-link-icon">
              <CalendarPlus size={14} /> Create event
            </Link>
          )}
        </nav>

        <div className="navbar-auth">
          {isAuthenticated ? (
            <>
              <span className="navbar-user">Hi, {user?.name?.split(' ')[0]}</span>
              <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/register" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </div>

        <button className="navbar-burger" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="navbar-mobile-menu">
          <Link to="/" onClick={() => setMenuOpen(false)}>Browse</Link>
          <Link to="/nearby" onClick={() => setMenuOpen(false)}>Near me</Link>
          {isAuthenticated && <Link to="/my-bookings" onClick={() => setMenuOpen(false)}>My bookings</Link>}
          {isOrganizer && <Link to="/organizer/new-event" onClick={() => setMenuOpen(false)}>Create event</Link>}
          <div className="navbar-mobile-auth">
            {isAuthenticated ? (
              <button className="btn btn-ghost btn-block" onClick={handleLogout}>Log out</button>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-block" onClick={() => setMenuOpen(false)}>Log in</Link>
                <Link to="/register" className="btn btn-primary btn-block" onClick={() => setMenuOpen(false)}>Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
