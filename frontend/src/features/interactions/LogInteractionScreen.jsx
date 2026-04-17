import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchHCPs, selectHCP } from '../hcp/hcpSlice'
import { createInteraction, clearSubmitState, fetchInteractions } from './interactionsSlice'
import { addToast } from '../ui/uiSlice'
import {
  addMessage, setConnected, handleAgentMessage,
  setSessionId,
} from '../chat/chatSlice'
import { chatWebSocket } from '../../services/chatService'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

const INTERACTION_TYPES = [
  'Meeting', 'Detail Visit', 'Lunch Meeting', 'Conference',
  'Phone Call', 'Virtual Meeting', 'Sample Drop',
]
const PRODUCTS = ['Jardiance', 'Ozempic', 'Trulicity', 'Farxiga', 'Victoza', 'Metformin']

/* ─────────────────────────────────────────
   HCP NAME SEARCH INPUT (inline in form)
───────────────────────────────────────── */
function HCPNameInput({ hcpList, selected, onSelect }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = hcpList.filter(h =>
    !search ||
    h.name?.toLowerCase().includes(search.toLowerCase()) ||
    h.specialty?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="form-input"
        placeholder="Search or select HCP..."
        value={selected ? selected.name : search}
        onChange={e => { setSearch(e.target.value); onSelect(null); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 99,
          background: 'white', border: '1px solid var(--gray-200)',
          borderRadius: 8, boxShadow: 'var(--shadow-lg)',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 12, textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.82rem' }}>No HCPs found</div>
          ) : filtered.map(hcp => (
            <div
              key={hcp.id}
              onMouseDown={() => { onSelect(hcp); setSearch(''); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', cursor: 'pointer',
                background: selected?.id === hcp.id ? 'var(--primary-light)' : 'white',
                fontSize: '0.85rem',
              }}
              onMouseEnter={e => { if (selected?.id !== hcp.id) e.currentTarget.style.background = 'var(--gray-50)' }}
              onMouseLeave={e => { e.currentTarget.style.background = selected?.id === hcp.id ? 'var(--primary-light)' : 'white' }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0,
              }}>
                {hcp.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hcp.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{hcp.specialty}</div>
              </div>
              <Badge preset={`tier-${hcp.tier}`}>Tier {hcp.tier}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   AI ASSISTANT SIDE PANEL
───────────────────────────────────────── */
function AIChatPanel({ hcp }) {
  const dispatch = useDispatch()
  const { messages, isConnected, isTyping, streamingContent } = useSelector(s => s.chat)
  const [input, setInput] = useState('')
  const [localSessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2)}`)
  const messagesEndRef = useRef(null)
  const wsConnecting = useRef(false)

  useEffect(() => {
    dispatch(setSessionId(localSessionId))
  }, [])

  useEffect(() => {
    if (!hcp?.id || wsConnecting.current) return
    wsConnecting.current = true
    chatWebSocket.on('connected', val => dispatch(setConnected(val)))
    chatWebSocket.on('message', data => dispatch(handleAgentMessage(data)))
    chatWebSocket.connect(localSessionId, hcp.id)
    dispatch(addMessage({
      role: 'assistant',
      content: `Log interaction details here (e.g., "Met Dr. ${hcp.name?.split(' ')[1] || 'Smith'}, discussed Prodo-X efficacy, positive sentiment, shared brochure") or ask for help.`,
    }))
    return () => { chatWebSocket.disconnect(); wsConnecting.current = false }
  }, [hcp?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, streamingContent])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text) return
    dispatch(addMessage({ role: 'user', content: text }))
    setInput('')
    const sent = chatWebSocket.send(text)
    if (!sent) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, hcp_id: hcp?.id, session_id: localSessionId }),
        })
        const data = await res.json()
        dispatch(addMessage({ role: 'assistant', content: data.message }))
      } catch {
        dispatch(addMessage({ role: 'assistant', content: 'Connection error. Check the backend is running.' }))
      }
    }
  }, [input, hcp?.id, localSessionId, dispatch])

  const lastAIMessage = [...messages].reverse().find(m => m.role === 'assistant')
  const displayContent = streamingContent || lastAIMessage?.content || ''

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', minHeight: 400,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        paddingBottom: 12, borderBottom: '1px solid var(--gray-100)', marginBottom: 14,
      }}>
        <span style={{ fontSize: '1.1rem' }}>🤖</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>AI Assistant</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--gray-400)' }}>Log Interaction details here via chat</div>
        </div>
        <span style={{
          marginLeft: 'auto',
          width: 7, height: 7, borderRadius: '50%',
          background: isConnected ? 'var(--success)' : 'var(--gray-300)',
          display: 'inline-block', flexShrink: 0,
        }} />
      </div>

      {/* Message display area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2, paddingBottom: 8 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 10,
          }}>
            <div style={{
              maxWidth: '92%',
              padding: '10px 13px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.role === 'user' ? 'var(--primary)' : 'var(--gray-50)',
              color: msg.role === 'user' ? 'white' : 'var(--gray-700)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--gray-200)',
              fontSize: '0.82rem',
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {streamingContent && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
            <div style={{
              maxWidth: '92%', padding: '10px 13px',
              borderRadius: '12px 12px 12px 2px',
              background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
              fontSize: '0.82rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', color: 'var(--gray-700)',
            }}>{streamingContent}</div>
          </div>
        )}
        {isTyping && (
          <div style={{ display: 'flex', gap: 4, padding: '8px 0', alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 6, height: 6, borderRadius: '50%', background: 'var(--gray-400)',
                display: 'inline-block',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'flex-end',
        borderTop: '1px solid var(--gray-200)', paddingTop: 10, marginTop: 6,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Describe Interaction..."
          rows={2}
          style={{
            flex: 1, padding: '8px 10px',
            border: '1px solid var(--gray-300)', borderRadius: 8,
            fontSize: '0.82rem', fontFamily: 'inherit',
            resize: 'none', outline: 'none', minWidth: 0,
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--gray-300)'}
        />
        <button
          onClick={send}
          disabled={!input.trim() || isTyping}
          style={{
            padding: '8px 16px',
            background: !input.trim() || isTyping ? 'var(--gray-300)' : 'var(--primary)',
            color: 'white', border: 'none', borderRadius: 8,
            fontWeight: 700, fontSize: '0.82rem', cursor: !input.trim() ? 'not-allowed' : 'pointer',
            alignSelf: 'stretch', flexShrink: 0, transition: 'background 0.15s',
          }}
        >
          Log
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────── */
export default function LogInteractionScreen() {
  const dispatch = useDispatch()
  const selectedHCP = useSelector(s => s.hcp.selected)
  const hcpList = useSelector(s => s.hcp.list)
  const { submitting, submitSuccess, aiSummary, complianceResult, error } = useSelector(s => s.interactions)

  const [form, setForm] = useState({
    interaction_type: 'Meeting',
    interaction_date: new Date().toISOString().split('T')[0],
    interaction_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    attendees: '',
    topics_discussed: '',
    products_discussed: [],
    samples_provided: [],
    key_messages_delivered: '',
    hcp_feedback: '',
    follow_up_required: false,
    follow_up_date: '',
    follow_up_notes: '',
  })
  const [sampleRows, setSampleRows] = useState([{ product: '', quantity: 1 }])
  const [showResult, setShowResult] = useState(false)

  useEffect(() => { dispatch(fetchHCPs()) }, [dispatch])
  useEffect(() => {
    if (selectedHCP?.id) dispatch(fetchInteractions({ hcp_id: selectedHCP.id }))
  }, [dispatch, selectedHCP?.id])

  useEffect(() => {
    if (submitSuccess) {
      setShowResult(true)
      dispatch(addToast({ type: 'success', title: 'Interaction Logged', message: 'AI summary and compliance check complete.' }))
    }
  }, [submitSuccess, dispatch])

  useEffect(() => () => dispatch(clearSubmitState()), [dispatch])

  const handleHCPSelect = (hcp) => {
    dispatch(selectHCP(hcp))
    if (hcp) dispatch(fetchInteractions({ hcp_id: hcp.id }))
  }

  const toggleProduct = (p) => setForm(f => ({
    ...f,
    products_discussed: f.products_discussed.includes(p)
      ? f.products_discussed.filter(x => x !== p)
      : [...f.products_discussed, p],
  }))

  const updateSample = (idx, field, val) =>
    setSampleRows(rows => rows.map((r, i) => i === idx ? { ...r, [field]: val } : r))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedHCP) {
      dispatch(addToast({ type: 'error', message: 'Please select an HCP first.' }))
      return
    }
    dispatch(createInteraction({
      hcp_id: selectedHCP.id,
      ...form,
      key_messages_delivered: form.topics_discussed,
      samples_provided: sampleRows.filter(s => s.product && s.quantity > 0),
    }))
  }

  const resetForm = () => {
    setForm({
      interaction_type: 'Meeting',
      interaction_date: new Date().toISOString().split('T')[0],
      interaction_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      attendees: '', topics_discussed: '', products_discussed: [],
      samples_provided: [], key_messages_delivered: '', hcp_feedback: '',
      follow_up_required: false, follow_up_date: '', follow_up_notes: '',
    })
    setSampleRows([{ product: '', quantity: 1 }])
    setShowResult(false)
    dispatch(clearSubmitState())
  }

  return (
    <div className="fade-in log-screen-grid" style={{ alignItems: 'start' }}>

      {/* ══════════════════════════════════════
          LEFT — Interaction Form
      ══════════════════════════════════════ */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: 20 }}>
          Log HCP Interaction
        </h2>

        {showResult && submitSuccess ? (
          /* ── Success state ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.4rem' }}>✅</span>
              <h3 style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.95rem' }}>Interaction Logged Successfully</h3>
            </div>
            {aiSummary && (
              <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: 14, border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 6 }}>🤖 AI Summary</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>{aiSummary}</p>
              </div>
            )}
            {complianceResult && (
              <div style={{
                borderRadius: 8, padding: 12,
                background: complianceResult.status === 'compliant' ? '#DCFCE7' : complianceResult.status === 'flagged' ? '#FEE2E2' : '#FEF9C3',
                border: `1px solid ${complianceResult.status === 'compliant' ? '#86EFAC' : complianceResult.status === 'flagged' ? '#FCA5A5' : '#FDE047'}`,
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>
                  Compliance: {complianceResult.status?.charAt(0).toUpperCase() + complianceResult.status?.slice(1)}
                </div>
                {complianceResult.notes && <p style={{ fontSize: '0.78rem', color: 'var(--gray-700)' }}>{complianceResult.notes}</p>}
              </div>
            )}
            <Button variant="primary" onClick={resetForm}>Log Another Interaction</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Section: Interaction Details */}
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Interaction Details
              </p>

              {/* Row 1: HCP Name + Interaction Type */}
              <div className="form-row-2" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">HCP Name</label>
                  <HCPNameInput hcpList={hcpList} selected={selectedHCP} onSelect={handleHCPSelect} />
                </div>
                <div className="form-group">
                  <label className="form-label">Interaction Type</label>
                  <select className="form-select" value={form.interaction_type} onChange={e => setForm(f => ({ ...f, interaction_type: e.target.value }))}>
                    {INTERACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Date + Time */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={form.interaction_date} onChange={e => setForm(f => ({ ...f, interaction_date: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input type="time" className="form-input" value={form.interaction_time} onChange={e => setForm(f => ({ ...f, interaction_time: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Attendees */}
            <div className="form-group">
              <label className="form-label">Attendees</label>
              <input
                className="form-input"
                placeholder="Enter names or search..."
                value={form.attendees}
                onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))}
              />
            </div>

            {/* Topics Discussed */}
            <div className="form-group">
              <label className="form-label">Topics Discussed</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Enter key discussion points..."
                value={form.topics_discussed}
                onChange={e => setForm(f => ({ ...f, topics_discussed: e.target.value }))}
              />
              <button
                type="button"
                style={{
                  alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', color: 'var(--primary)',
                  fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', padding: '4px 0',
                }}
                onClick={() => dispatch(addToast({ type: 'info', message: 'Voice note feature requires microphone consent.' }))}
              >
                🎙️ Summarize from Voice Note (Requires Consent)
              </button>
            </div>

            {/* Materials Shared / Samples */}
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Materials Shared / Samples Distributed
              </p>

              {/* Products */}
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Materials Shared</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PRODUCTS.map(p => (
                    <button
                      key={p} type="button" onClick={() => toggleProduct(p)}
                      style={{
                        padding: '4px 11px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500,
                        cursor: 'pointer', transition: 'all 0.15s',
                        border: form.products_discussed.includes(p) ? '2px solid var(--primary)' : '1px solid var(--gray-300)',
                        background: form.products_discussed.includes(p) ? 'var(--primary)' : 'white',
                        color: form.products_discussed.includes(p) ? 'white' : 'var(--gray-600)',
                      }}
                    >{p}</button>
                  ))}
                </div>
              </div>

              {/* Samples */}
              <div className="form-group">
                <label className="form-label">Samples Distributed</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sampleRows.map((row, i) => (
                    <div key={i} className="sample-row">
                      <select className="form-select" value={row.product} onChange={e => updateSample(i, 'product', e.target.value)} style={{ flex: 2 }}>
                        <option value="">Select product...</option>
                        {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <input type="number" className="form-input" value={row.quantity} min="1" max="20"
                        onChange={e => updateSample(i, 'quantity', parseInt(e.target.value))}
                        style={{ width: 70, flex: 'none' }} />
                      <button type="button" onClick={() => setSampleRows(rows => rows.filter((_, idx) => idx !== i))}
                        style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}>×</button>
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => setSampleRows(r => [...r, { product: '', quantity: 1 }])}
                    style={{
                      alignSelf: 'flex-start', background: 'none', border: 'none',
                      color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', padding: '2px 0',
                    }}>
                    + Add Sample
                  </button>
                </div>
              </div>
            </div>

            {/* HCP Feedback */}
            <div className="form-group">
              <label className="form-label">HCP Feedback / Notes</label>
              <textarea className="form-textarea" rows={2} placeholder="How did the HCP respond?"
                value={form.hcp_feedback} onChange={e => setForm(f => ({ ...f, hcp_feedback: e.target.value }))} />
            </div>

            {/* Follow-up */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, follow_up_required: !f.follow_up_required }))}
                  style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: form.follow_up_required ? 'var(--primary)' : 'var(--gray-300)',
                    border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2,
                    left: form.follow_up_required ? 20 : 2,
                    width: 18, height: 18, borderRadius: '50%', background: 'white',
                    transition: 'left 0.2s', display: 'block', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--gray-700)' }}>Follow-up Required</span>
              </div>
              {form.follow_up_required && (
                <div className="form-row-2" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <div className="form-group">
                    <label className="form-label">Follow-up Date</label>
                    <input type="date" className="form-input" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Follow-up Notes</label>
                    <input type="text" className="form-input" placeholder="Brief note..." value={form.follow_up_notes} onChange={e => setForm(f => ({ ...f, follow_up_notes: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 6, fontSize: '0.8rem' }}>
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" loading={submitting} disabled={!selectedHCP}>
              {submitting ? 'Logging & Analyzing...' : '🚀 Log Interaction'}
            </Button>
            {!selectedHCP && (
              <p style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: -8 }}>
                Please select an HCP from the HCP Name field above.
              </p>
            )}
          </form>
        )}
      </div>

      {/* ══════════════════════════════════════
          RIGHT — AI Assistant Chat Panel
      ══════════════════════════════════════ */}
      <div className="card" style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column' }}>
        <AIChatPanel hcp={selectedHCP} />
      </div>

    </div>
  )
}
