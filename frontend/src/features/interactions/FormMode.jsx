import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createInteraction, clearSubmitState } from './interactionsSlice'
import { addToast } from '../ui/uiSlice'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

const PRODUCTS = ['Jardiance', 'Ozempic', 'Trulicity', 'Farxiga', 'Victoza', 'Metformin']
const INTERACTION_TYPES = [
  { value: 'detail_visit', label: 'Detail Visit' },
  { value: 'lunch_meeting', label: 'Lunch Meeting' },
  { value: 'conference', label: 'Conference' },
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'virtual_meeting', label: 'Virtual Meeting' },
  { value: 'sample_drop', label: 'Sample Drop' },
]

export default function FormMode({ hcp, onSuccess }) {
  const dispatch = useDispatch()
  const { submitting, submitSuccess, aiSummary, complianceResult, error } = useSelector(s => s.interactions)

  const [form, setForm] = useState({
    interaction_date: new Date().toISOString().split('T')[0],
    interaction_type: 'detail_visit',
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

  useEffect(() => {
    if (submitSuccess) {
      setShowResult(true)
      dispatch(addToast({ type: 'success', title: 'Interaction Logged', message: 'AI summary and compliance check complete.' }))
      onSuccess?.()
    }
  }, [submitSuccess, dispatch, onSuccess])

  useEffect(() => {
    return () => dispatch(clearSubmitState())
  }, [dispatch])

  const toggle = (product) => {
    setForm(f => ({
      ...f,
      products_discussed: f.products_discussed.includes(product)
        ? f.products_discussed.filter(p => p !== product)
        : [...f.products_discussed, product],
    }))
  }

  const updateSample = (idx, field, value) => {
    setSampleRows(rows => rows.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!hcp) {
      dispatch(addToast({ type: 'error', message: 'Please select an HCP first.' }))
      return
    }
    const validSamples = sampleRows.filter(s => s.product && s.quantity > 0)
    dispatch(createInteraction({
      hcp_id: hcp.id,
      ...form,
      samples_provided: validSamples,
    }))
  }

  if (showResult && submitSuccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <h3 style={{ fontWeight: 700, color: 'var(--success)' }}>Interaction Logged Successfully</h3>
        </div>

        {aiSummary && (
          <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: 16, border: '1px solid #BFDBFE' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>🤖 AI Summary</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>{aiSummary}</p>
          </div>
        )}

        {complianceResult && (
          <div style={{
            borderRadius: 8, padding: 14,
            background: complianceResult.status === 'compliant' ? '#DCFCE7' : complianceResult.status === 'flagged' ? '#FEE2E2' : '#FEF9C3',
            border: `1px solid ${complianceResult.status === 'compliant' ? '#86EFAC' : complianceResult.status === 'flagged' ? '#FCA5A5' : '#FDE047'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span>{complianceResult.status === 'compliant' ? '✅' : complianceResult.status === 'flagged' ? '⚠️' : '🕐'}</span>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Compliance: {complianceResult.status?.charAt(0).toUpperCase() + complianceResult.status?.slice(1)}
              </span>
            </div>
            {complianceResult.notes && (
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-700)' }}>{complianceResult.notes}</p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => { setShowResult(false); setForm({ interaction_date: new Date().toISOString().split('T')[0], interaction_type: 'detail_visit', products_discussed: [], samples_provided: [], key_messages_delivered: '', hcp_feedback: '', follow_up_required: false, follow_up_date: '', follow_up_notes: '' }); setSampleRows([{ product: '', quantity: 1 }]); dispatch(clearSubmitState()) }}>
            Log Another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Row 1: Date + Type */}
      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label">Interaction Date *</label>
          <input type="date" className="form-input" value={form.interaction_date} onChange={e => setForm(f => ({ ...f, interaction_date: e.target.value }))} required />
        </div>
        <div className="form-group">
          <label className="form-label">Interaction Type *</label>
          <select className="form-select" value={form.interaction_type} onChange={e => setForm(f => ({ ...f, interaction_type: e.target.value }))} required>
            {INTERACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* Products */}
      <div className="form-group">
        <label className="form-label">Products Discussed</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRODUCTS.map(p => (
            <button
              key={p} type="button"
              onClick={() => toggle(p)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: form.products_discussed.includes(p) ? '2px solid var(--primary)' : '1px solid var(--gray-300)',
                background: form.products_discussed.includes(p) ? 'var(--primary)' : 'white',
                color: form.products_discussed.includes(p) ? 'white' : 'var(--gray-600)',
                transition: 'all 0.15s',
              }}
            >{p}</button>
          ))}
        </div>
      </div>

      {/* Samples */}
      <div className="form-group">
        <label className="form-label">Samples Provided</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sampleRows.map((row, i) => (
            <div key={i} className="sample-row">
              <select className="form-select" value={row.product} onChange={e => updateSample(i, 'product', e.target.value)} style={{ flex: 2 }}>
                <option value="">Select product...</option>
                {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="number" className="form-input" value={row.quantity} min="1" max="20" onChange={e => updateSample(i, 'quantity', parseInt(e.target.value))} style={{ flex: 1, width: 80 }} />
              <button type="button" onClick={() => setSampleRows(rows => rows.filter((_, idx) => idx !== i))}
                style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" style={{ alignSelf: 'flex-start', color: 'var(--primary)' }}
            onClick={() => setSampleRows(r => [...r, { product: '', quantity: 1 }])}>
            + Add Sample
          </Button>
        </div>
      </div>

      {/* Key Messages */}
      <div className="form-group">
        <label className="form-label">Key Messages Delivered</label>
        <textarea className="form-textarea" rows={3} placeholder="What messages did you convey to the HCP?"
          value={form.key_messages_delivered} onChange={e => setForm(f => ({ ...f, key_messages_delivered: e.target.value }))} />
      </div>

      {/* HCP Feedback */}
      <div className="form-group">
        <label className="form-label">HCP Feedback</label>
        <textarea className="form-textarea" rows={3} placeholder="How did the HCP respond? Any objections or interest?"
          value={form.hcp_feedback} onChange={e => setForm(f => ({ ...f, hcp_feedback: e.target.value }))} />
      </div>

      {/* Follow-up toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, follow_up_required: !f.follow_up_required }))}
            style={{
              width: 44, height: 24, borderRadius: 12,
              background: form.follow_up_required ? 'var(--primary)' : 'var(--gray-300)',
              border: 'none', cursor: 'pointer',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 2,
              left: form.follow_up_required ? 22 : 2,
              width: 20, height: 20, borderRadius: '50%', background: 'white',
              transition: 'left 0.2s', display: 'block', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-700)' }}>Follow-up Required</span>
        </div>

        {form.follow_up_required && (
          <div className="form-row-2" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input type="date" className="form-input" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Follow-up Notes</label>
              <input type="text" className="form-input" placeholder="Brief note about follow-up..." value={form.follow_up_notes} onChange={e => setForm(f => ({ ...f, follow_up_notes: e.target.value }))} />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 6, fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" loading={submitting} disabled={!hcp}>
        {submitting ? 'Logging & Analyzing...' : '🚀 Log Interaction with AI Analysis'}
      </Button>
      {!hcp && <p style={{ fontSize: '0.78rem', color: 'var(--warning)' }}>Please select an HCP from the panel on the right first.</p>}

    </form>
  )
}
