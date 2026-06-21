import React from 'react'
import { Ticket } from 'lucide-react'
import './AuthDecor.css'

export default function AuthDecor({ eyebrow, title, subtitle }) {
  return (
    <div className="auth-decor">
      <span className="auth-decor-eyebrow">{eyebrow}</span>
      <h1 className="auth-decor-title">{title}</h1>
      <p className="auth-decor-subtitle">{subtitle}</p>

      <div className="auth-decor-stub" aria-hidden="true">
        <div className="mock-ticket">
          <div className="mock-ticket-main">
            <Ticket size={16} />
            <div className="mock-ticket-line mock-ticket-line-lg" />
            <div className="mock-ticket-line mock-ticket-line-sm" />
            <div className="mock-ticket-chips">
              <span />
              <span />
            </div>
          </div>
          <div className="mock-ticket-divider" />
          <div className="mock-ticket-stub" />
        </div>
      </div>
    </div>
  )
}
