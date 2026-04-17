import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchInteractions, deleteInteraction } from './interactionsSlice'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { addToast } from '../ui/uiSlice'

export default function InteractionHistory() {
  const dispatch = useDispatch()
  const { list, loading } = useSelector(s => s.interactions)
  const [filters, setFilters] = useState({ interaction_type: '', compliance_status: '', from_date: '', to_date: '' })
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    dispatch(fetchInteractions(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))))
  }, [dispatch, filters])

  const handleDelete = async (id) => {
    if (!confirm('Delete this interaction?')) return
    dispatch(deleteInteraction(id))
    dispatch(addToast({ type: 'success', message: 'Interaction deleted.' }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Interaction History</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: 2 }}>{list.length} interactions found</p>
        </div>
        <Link to="/interactions/new">
          <Button variant="primary" size="sm">✏️ Log New</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="card filter-bar" style={{ padding: '12px 16px' }}>
        <select className="form-select" value={filters.interaction_type} onChange={e => setFilters(f => ({ ...f, interaction_type: e.target.value }))} style={{ maxWidth: 180, flex: '1 1 140px' }}>
          <option value="">All Types</option>
          <option value="detail_visit">Detail Visit</option>
          <option value="lunch_meeting">Lunch Meeting</option>
          <option value="phone_call">Phone Call</option>
          <option value="virtual_meeting">Virtual Meeting</option>
          <option value="sample_drop">Sample Drop</option>
          <option value="conference">Conference</option>
        </select>
        <select className="form-select" value={filters.compliance_status} onChange={e => setFilters(f => ({ ...f, compliance_status: e.target.value }))} style={{ maxWidth: 160, flex: '1 1 120px' }}>
          <option value="">All Compliance</option>
          <option value="compliant">Compliant</option>
          <option value="flagged">Flagged</option>
          <option value="pending">Pending</option>
        </select>
        <input type="date" className="form-input" value={filters.from_date} onChange={e => setFilters(f => ({ ...f, from_date: e.target.value }))} style={{ maxWidth: 150, flex: '1 1 120px' }} />
        <input type="date" className="form-input" value={filters.to_date} onChange={e => setFilters(f => ({ ...f, to_date: e.target.value }))} style={{ maxWidth: 150, flex: '1 1 120px' }} />
        {Object.values(filters).some(v => v) && (
          <Button variant="ghost" size="sm" onClick={() => setFilters({ interaction_type: '', compliance_status: '', from_date: '', to_date: '' })}>
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : list.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--gray-400)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
          <p>No interactions found.</p>
          <Link to="/interactions/new" style={{ display: 'inline-block', marginTop: 12 }}>
            <Button variant="primary" size="sm">Log Your First Interaction</Button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(interaction => (
            <div key={interaction.id} className="card" style={{ overflow: 'hidden' }}>
              <div
                style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
                onClick={() => setExpanded(expanded === interaction.id ? null : interaction.id)}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                }}>
                  {(interaction.hcp_name || 'U').charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {interaction.hcp_name || 'Unknown HCP'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                    {interaction.interaction_type?.replace(/_/g, ' ')} · {interaction.interaction_date}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge preset={interaction.compliance_status || 'pending'}>{interaction.compliance_status}</Badge>
                  {interaction.follow_up_required && <Badge preset="primary">Follow-up</Badge>}
                </div>
                <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>{expanded === interaction.id ? '▲' : '▼'}</span>
              </div>

              {expanded === interaction.id && (
                <div style={{
                  padding: '0 16px 16px',
                  borderTop: '1px solid var(--gray-100)',
                  animation: 'fadeIn 0.2s ease-out',
                }}>
                  {interaction.ai_summary && (
                    <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '12px', margin: '12px 0', border: '1px solid #BFDBFE' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>🤖 AI Summary</div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--gray-700)', lineHeight: 1.5 }}>{interaction.ai_summary}</p>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 10 }}>
                    {interaction.products_discussed?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 }}>Products Discussed</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {interaction.products_discussed.map(p => <Badge key={p} preset="primary" style={{ fontSize: '0.68rem' }}>{p}</Badge>)}
                        </div>
                      </div>
                    )}
                    {interaction.key_messages_delivered && (
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 }}>Key Messages</div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--gray-700)' }}>{interaction.key_messages_delivered}</p>
                      </div>
                    )}
                    {interaction.hcp_feedback && (
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 }}>HCP Feedback</div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--gray-700)' }}>{interaction.hcp_feedback}</p>
                      </div>
                    )}
                    {interaction.follow_up_required && (
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 }}>Follow-up</div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>📅 {interaction.follow_up_date || 'Date TBD'}</p>
                        {interaction.follow_up_notes && <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>{interaction.follow_up_notes}</p>}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(interaction.id)}>Delete</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
