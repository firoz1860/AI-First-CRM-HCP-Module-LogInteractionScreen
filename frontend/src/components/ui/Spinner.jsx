import React from 'react'

export default function Spinner({ size = 24, color = 'var(--primary)' }) {
  return (
    <span style={{
      width: size,
      height: size,
      border: `2px solid ${color}20`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
      flexShrink: 0,
    }} />
  )
}
