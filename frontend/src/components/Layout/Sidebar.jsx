import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { toggleMobileSidebar } from '../../features/ui/uiSlice'

const navItems = [
  { path: '/',                  label: 'Dashboard',       icon: '📊', exact: true },
  { path: '/hcps',              label: 'HCPs',            icon: '👨‍⚕️' },
  { path: '/interactions/new',  label: 'Log Interaction', icon: '✏️' },
  { path: '/interactions',      label: 'History',         icon: '📋' },
]

export default function Sidebar({ mobile = false }) {
  const dispatch = useDispatch()
  const location = useLocation()

  const handleNavClick = () => {
    if (mobile) dispatch(toggleMobileSidebar())
  }

  return (
    <aside style={{
      width: '100%',
      minWidth: 220,
      height: '100vh',
      background: 'var(--gray-900)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {/* ── Logo ── */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, background: 'var(--primary)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', flexShrink: 0,
          }}>🧬</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              AI-First CRM
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
              HCP Module
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: '10px 0' }}>
        {navItems.map(item => {
          const active = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path) && item.path !== '/'

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                margin: '1px 8px',
                borderRadius: 7,
                color: active ? 'white' : 'rgba(255,255,255,0.55)',
                background: active ? 'rgba(37,99,235,0.75)' : 'transparent',
                fontSize: '0.85rem',
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>JD</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              John Doe
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>rep_001 · Northeast</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
