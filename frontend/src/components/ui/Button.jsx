import React from 'react'

const variants = {
  primary: {
    background: 'var(--primary)',
    color: 'white',
    border: '1px solid var(--primary)',
  },
  secondary: {
    background: 'white',
    color: 'var(--gray-700)',
    border: '1px solid var(--gray-300)',
  },
  danger: {
    background: 'var(--danger)',
    color: 'white',
    border: '1px solid var(--danger)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--gray-600)',
    border: '1px solid transparent',
  },
  success: {
    background: 'var(--success)',
    color: 'white',
    border: '1px solid var(--success)',
  },
}

const sizes = {
  sm: { padding: '5px 12px', fontSize: '0.8rem' },
  md: { padding: '8px 16px', fontSize: '0.875rem' },
  lg: { padding: '11px 24px', fontSize: '0.95rem' },
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  style = {},
  ...props
}) {
  const v = variants[variant] || variants.primary
  const s = sizes[size] || sizes.md

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...v,
        ...s,
        borderRadius: '6px',
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        width: fullWidth ? '100%' : 'auto',
        justifyContent: 'center',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
        ...style,
      }}
      {...props}
    >
      {loading && (
        <span style={{
          width: 14, height: 14,
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          display: 'inline-block',
        }} />
      )}
      {children}
    </button>
  )
}
