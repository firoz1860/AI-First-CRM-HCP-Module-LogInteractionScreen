import React from 'react'
import { useDispatch } from 'react-redux'
import { toggleSidebar, toggleMobileSidebar } from '../../features/ui/uiSlice'

export default function TopBar({ title }) {
  const dispatch = useDispatch()

  return (
    <header style={{
      height: 'var(--topbar-height)',
      background: 'white',
      borderBottom: '1px solid var(--gray-200)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 10,
      flexShrink: 0,
      boxShadow: 'var(--shadow-sm)',
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Hamburger — mobile/tablet */}
      <button
        onClick={() => dispatch(toggleMobileSidebar())}
        aria-label="Open menu"
        style={{
          display: 'none',
          padding: '7px',
          borderRadius: 7,
          color: 'var(--gray-600)',
          background: 'var(--gray-100)',
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          lineHeight: 1,
        }}
        className="mobile-menu-btn"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="3" y1="6"  x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Sidebar toggle — desktop */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
        style={{
          display: 'flex',
          padding: '7px',
          borderRadius: 7,
          color: 'var(--gray-500)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          lineHeight: 1,
        }}
        className="desktop-toggle-btn"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="3" y1="6"  x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Page title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <h1 style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--gray-800)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{title}</h1>
        )}
      </div>

      {/* User avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--primary)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '0.75rem', fontWeight: 700,
          cursor: 'pointer',
        }}>JD</div>
        <div className="topbar-user-info" style={{ lineHeight: 1.3 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--gray-800)' }}>John Doe</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--gray-400)' }}>Field Rep</div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .mobile-menu-btn       { display: flex !important; }
          .desktop-toggle-btn    { display: none !important; }
        }
        @media (max-width: 639px) {
          .topbar-user-info      { display: none; }
        }
      `}</style>
    </header>
  )
}
