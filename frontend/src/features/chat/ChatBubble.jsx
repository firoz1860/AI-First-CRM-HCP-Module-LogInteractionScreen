import React from 'react'
import Spinner from '../../components/ui/Spinner'

const TOOL_LABELS = {
  log_interaction: '📝 Logging interaction...',
  edit_interaction: '✏️ Editing interaction...',
  get_hcp_profile: '👤 Loading HCP profile...',
  suggest_next_best_action: '💡 Generating recommendation...',
  check_compliance: '🔍 Checking compliance...',
}

export function TypingIndicator({ toolExecuting }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'var(--gray-200)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.85rem', flexShrink: 0,
      }}>🤖</div>
      <div style={{
        background: 'white',
        border: '1px solid var(--gray-200)',
        borderRadius: '12px 12px 12px 0',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {toolExecuting ? (
          <>
            <Spinner size={14} />
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>
              {TOOL_LABELS[toolExecuting] || `Running ${toolExecuting}...`}
            </span>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 6, height: 6, borderRadius: '50%', background: 'var(--gray-400)',
                animation: `pulse 1.2s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      alignItems: 'flex-end',
      gap: 8,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--gray-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem', flexShrink: 0, marginBottom: 2,
        }}>🤖</div>
      )}
      <div style={{
        maxWidth: '75%',
        background: isUser ? 'var(--primary)' : 'white',
        color: isUser ? 'white' : 'var(--gray-800)',
        border: isUser ? 'none' : '1px solid var(--gray-200)',
        borderRadius: isUser ? '12px 12px 0 12px' : '12px 12px 12px 0',
        padding: '10px 14px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <p style={{ fontSize: '0.875rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</p>
        {message.timestamp && (
          <div style={{ fontSize: '0.68rem', opacity: 0.6, marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  )
}
