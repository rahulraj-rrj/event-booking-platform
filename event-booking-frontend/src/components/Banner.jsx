import React from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function Banner({ type = 'error', children }) {
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle
  const className = type === 'success' ? 'success-banner' : 'error-banner'

  return (
    <div className={className}>
      <Icon />
      <span>{children}</span>
    </div>
  )
}
