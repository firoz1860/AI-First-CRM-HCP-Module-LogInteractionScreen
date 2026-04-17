import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { removeToast } from '../../features/ui/uiSlice'

function ToastItem({ toast }) {
  const dispatch = useDispatch()

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(toast.id)), toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [toast.id, dispatch])

  const colors = {
    success: { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' },
    error: { bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' },
    warning: { bg: '#FEF9C3', color: '#A16207', border: '#FDE047' },
    info: { bg: '#EFF6FF', color: '#2563EB', border: '#93C5FD' },
  }
  const c = colors[toast.type] || colors.info

  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }

  return (
    <div style={{
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      borderRadius: '8px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      minWidth: 260,
      maxWidth: 380,
      boxShadow: 'var(--shadow-md)',
      animation: 'slideIn 0.2s ease-out',
      fontSize: '0.875rem',
    }}>
      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{icons[toast.type] || icons.info}</span>
      <div style={{ flex: 1 }}>
        {toast.title && <div style={{ fontWeight: 600 }}>{toast.title}</div>}
        <div style={{ opacity: 0.9 }}>{toast.message}</div>
      </div>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem', opacity: 0.6, padding: '0 2px' }}
      >×</button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useSelector(s => s.ui.activeToasts)

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {toasts.map(toast => <ToastItem key={toast.id} toast={toast} />)}
    </div>
  )
}
