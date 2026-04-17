import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  addMessage, setConnected, handleAgentMessage,
  setSessionId, clearChat,
} from '../chat/chatSlice'
import ChatBubble, { TypingIndicator } from '../chat/ChatBubble'
import Button from '../../components/ui/Button'
import { chatWebSocket } from '../../services/chatService'
import { addToast } from '../ui/uiSlice'

const STARTER_PROMPTS = [
  { emoji: '🏥', text: 'I just had a detail visit with the doctor and discussed Jardiance for T2D patients.' },
  { emoji: '💊', text: 'Log a sample drop: left 3 Ozempic samples and briefly discussed dosing.' },
  { emoji: '📋', text: 'Edit my last interaction — add that she asked about patients over 75.' },
  { emoji: '👤', text: "Show me this HCP's full profile and recent interaction history." },
  { emoji: '💡', text: 'What should be my next best action with this HCP?' },
  { emoji: '✅', text: 'Check compliance on my recent interactions with this HCP.' },
]

export default function ChatMode({ hcp }) {
  const dispatch = useDispatch()
  const { messages, isConnected, isTyping, toolExecuting, sessionId, streamingContent } = useSelector(s => s.chat)
  const [input, setInput] = useState('')
  const [localSessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2)}`)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const wsConnecting = useRef(false)

  useEffect(() => {
    if (!sessionId) dispatch(setSessionId(localSessionId))
  }, [localSessionId, sessionId, dispatch])

  // Connect WebSocket
  useEffect(() => {
    if (!hcp?.id || wsConnecting.current) return
    wsConnecting.current = true

    chatWebSocket.on('connected', (val) => dispatch(setConnected(val)))
    chatWebSocket.on('message', (data) => dispatch(handleAgentMessage(data)))

    chatWebSocket.connect(localSessionId, hcp.id)

    // Welcome message
    dispatch(addMessage({
      role: 'assistant',
      content: `Hi! I'm your AI assistant. I'm connected and ready to help you log your interaction with ${hcp.name}. You can describe your visit in natural language, and I'll handle the rest.`,
    }))

    return () => {
      chatWebSocket.disconnect()
      wsConnecting.current = false
    }
  }, [hcp?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, streamingContent])

  const sendMessage = useCallback(async (text) => {
    const content = text || input.trim()
    if (!content) return

    dispatch(addMessage({ role: 'user', content }))
    setInput('')

    const sent = chatWebSocket.send(content)
    if (!sent) {
      // Fallback to HTTP
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content, hcp_id: hcp?.id, session_id: localSessionId }),
        })
        const data = await response.json()
        dispatch(addMessage({ role: 'assistant', content: data.message }))
      } catch (err) {
        dispatch(addMessage({ role: 'assistant', content: 'Connection error. Please check the backend is running.' }))
      }
    }
  }, [input, hcp?.id, localSessionId, dispatch])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 420 }}>
      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 12px',
        borderBottom: '1px solid var(--gray-200)', marginBottom: 12,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: isConnected ? 'var(--success)' : 'var(--gray-400)',
          display: 'inline-block',
        }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
          {isConnected ? 'Connected to AI Agent' : 'Connecting...'}
        </span>
        {messages.length > 1 && (
          <button onClick={() => dispatch(clearChat())}
            style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Clear chat
          </button>
        )}
      </div>

      {/* Starter prompts (show if only welcome message) */}
      {messages.length <= 1 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: 8 }}>Try a starter prompt:</p>
          <div className="chat-starters">
            {STARTER_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => sendMessage(p.text)}
                style={{
                  padding: '6px 10px', borderRadius: 20,
                  border: '1px solid var(--gray-200)',
                  background: 'var(--gray-50)', color: 'var(--gray-700)',
                  fontSize: '0.75rem', cursor: 'pointer',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <span>{p.emoji}</span>{p.text.slice(0, 35)}...
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 12,
        paddingRight: 4, paddingBottom: 8,
      }}>
        {messages.map(msg => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {streamingContent && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>🤖</div>
            <div style={{
              maxWidth: '75%', background: 'white', color: 'var(--gray-800)',
              border: '1px solid var(--gray-200)', borderRadius: '12px 12px 12px 0',
              padding: '10px 14px', boxShadow: 'var(--shadow-sm)',
            }}>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{streamingContent}</p>
            </div>
          </div>
        )}

        {(isTyping || toolExecuting) && <TypingIndicator toolExecuting={toolExecuting} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-row" style={{
        display: 'flex', gap: 8, alignItems: 'flex-end',
        borderTop: '1px solid var(--gray-200)', paddingTop: 12, marginTop: 8,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your visit... (Enter to send)"
          rows={2}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid var(--gray-300)',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.15s',
            minWidth: 0,
          }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--gray-300)'}
        />
        <Button
          variant="primary"
          onClick={() => sendMessage()}
          disabled={!input.trim() || isTyping}
          style={{ padding: '10px 16px', alignSelf: 'stretch', flexShrink: 0 }}
        >
          ➤
        </Button>
      </div>

      <style>{`
        @media (max-width: 639px) {
          .chat-container { min-height: 360px; }
          .chat-input-row textarea { font-size: 0.82rem; }
        }
      `}</style>
    </div>
  )
}
