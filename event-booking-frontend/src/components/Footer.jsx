import React from 'react'
import { Ticket } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Ticket size={16} />
          <span>Encore</span>
        </div>
        <p className="footer-tagline">Concurrency-safe seat booking, built phase by phase.</p>
      </div>
    </footer>
  )
}
