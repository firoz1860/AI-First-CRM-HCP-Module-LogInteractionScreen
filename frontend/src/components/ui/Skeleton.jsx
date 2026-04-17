import React from 'react'

export default function Skeleton({ width = '100%', height = 16, borderRadius = 6, style = {} }) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)',
      backgroundSize: '200% 100%',
      animation: 'pulse 1.5s ease-in-out infinite',
      ...style,
    }} />
  )
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton height={20} width="60%" />
      <Skeleton height={14} />
      <Skeleton height={14} width="80%" />
      <Skeleton height={14} width="40%" />
    </div>
  )
}
