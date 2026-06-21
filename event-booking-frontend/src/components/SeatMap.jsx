import React, { useMemo } from 'react'
import './SeatMap.css'

function parseSeat(seatNumber) {
  const match = seatNumber.match(/^([A-Za-z]+)(\d+)$/)
  if (!match) return { row: 'General', col: seatNumber }
  return { row: match[1], col: match[2] }
}

export default function SeatMap({ seats, selectedIds, onToggle }) {
  const rows = useMemo(() => {
    const grouped = {}
    seats.forEach((seat) => {
      const { row } = parseSeat(seat.seatNumber)
      if (!grouped[row]) grouped[row] = []
      grouped[row].push(seat)
    })
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  }, [seats])

  return (
    <div className="seat-map">
      <div className="seat-map-stage-wrap">
        <div className="seat-map-stage" />
      </div>
      <div className="seat-map-stage-label">STAGE</div>
      <div style={{ height: 18 }} />

      {rows.map(([row, rowSeats]) => (
        <div className="seat-map-row" key={row}>
          <span className="seat-map-row-label">{row}</span>
          <div className="seat-map-seats">
            {rowSeats
              .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true }))
              .map((seat) => {
                const isSelected = selectedIds.includes(seat.id)
                const isAvailable = seat.status === 'AVAILABLE'
                const classes = ['seat']
                if (isSelected) classes.push('seat-selected')
                else classes.push(`seat-${seat.status.toLowerCase()}`)

                return (
                  <button
                    key={seat.id}
                    type="button"
                    className={classes.join(' ')}
                    disabled={!isAvailable && !isSelected}
                    onClick={() => onToggle(seat)}
                    title={`${seat.seatNumber} · ${seat.seatType} · ₹${seat.price}`}
                  >
                    {parseSeat(seat.seatNumber).col}
                  </button>
                )
              })}
          </div>
        </div>
      ))}

      <div className="seat-map-legend">
        <span><i className="seat-dot seat-dot-available" /> Available</span>
        <span><i className="seat-dot seat-dot-selected" /> Selected</span>
        <span><i className="seat-dot seat-dot-locked" /> Reserved</span>
        <span><i className="seat-dot seat-dot-booked" /> Booked</span>
      </div>
    </div>
  )
}
