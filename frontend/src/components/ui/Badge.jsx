import React from 'react'

const presets = {
  'tier-A': { background: '#DCFCE7', color: '#15803D' },
  'tier-B': { background: '#FEF9C3', color: '#A16207' },
  'tier-C': { background: '#F1F5F9', color: '#475569' },
  'compliant': { background: '#DCFCE7', color: '#15803D' },
  'flagged': { background: '#FEE2E2', color: '#DC2626' },
  'pending': { background: '#FEF9C3', color: '#A16207' },
  'high': { background: '#FEE2E2', color: '#DC2626' },
  'medium': { background: '#FEF9C3', color: '#A16207' },
  'low': { background: '#DCFCE7', color: '#15803D' },
  'primary': { background: '#EFF6FF', color: '#2563EB' },
  'gray': { background: '#F3F4F6', color: '#374151' },
}

export default function Badge({ children, preset, style = {} }) {
  const colors = presets[preset] || presets.gray
  return (
    <span style={{
      ...colors,
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {children}
    </span>
  )
}
