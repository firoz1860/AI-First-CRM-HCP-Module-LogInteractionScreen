import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchHCPProfile, selectHCP } from './hcpSlice'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'

export default function HCPProfile() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { profile, loading } = useSelector(s => s.hcp)

  useEffect(() => {
    dispatch(fetchHCPProfile(id))
  }, [id, dispatch])

  if (loading) return (
    <div className="hcp-profile-grid">
      <SkeletonCard /><SkeletonCard />
    </div>
  )

  if (!profile) return <div style={{ padding: 24, color: 'var(--gray-500)' }}>HCP not found</div>

  const handleLogInteraction = () => {
    dispatch(selectHCP(profile))
    navigate('/interactions/new')
  }

  return (
    <div className="hcp-profile-grid">
      {/* Profile card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              width: 72, height: 72,
              background: 'var(--primary)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '1.4rem',
              margin: '0 auto 12px',
            }}>
              {profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--gray-900)' }}>{profile.name}</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>{profile.specialty}</p>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>{profile.institution}</p>
            <div style={{ marginTop: 10 }}>
              <Badge preset={`tier-${profile.tier}`} style={{ fontSize: '0.8rem' }}>Tier {profile.tier}</Badge>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem' }}>
            {profile.email && <div style={{ display: 'flex', gap: 8 }}><span>📧</span><span style={{ color: 'var(--gray-600)' }}>{profile.email}</span></div>}
            {profile.phone && <div style={{ display: 'flex', gap: 8 }}><span>📞</span><span style={{ color: 'var(--gray-600)' }}>{profile.phone}</span></div>}
            {profile.territory && <div style={{ display: 'flex', gap: 8 }}><span>📍</span><span style={{ color: 'var(--gray-600)' }}>{profile.territory}</span></div>}
          </div>

          <Button variant="primary" fullWidth style={{ marginTop: 16 }} onClick={handleLogInteraction}>
            ✏️ Log Interaction
          </Button>
        </div>

        {/* Metrics */}
        {profile.metrics && (
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 12, color: 'var(--gray-700)' }}>Engagement Metrics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--gray-500)' }}>Total Interactions</span>
                <span style={{ fontWeight: 600 }}>{profile.metrics.total_interactions}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--gray-500)' }}>Compliance Rate</span>
                <span style={{ fontWeight: 600, color: profile.metrics.compliance_rate >= 90 ? 'var(--success)' : 'var(--warning)' }}>
                  {profile.metrics.compliance_rate}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--gray-500)' }}>Open Follow-ups</span>
                <span style={{ fontWeight: 600 }}>{profile.metrics.open_follow_ups}</span>
              </div>
              {profile.metrics.last_interaction_date && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--gray-500)' }}>Last Visit</span>
                  <span style={{ fontWeight: 600 }}>{profile.metrics.last_interaction_date}</span>
                </div>
              )}
            </div>
            {profile.metrics.top_products?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: 6 }}>Top Products</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {profile.metrics.top_products.map(p => (
                    <Badge key={p} preset="primary" style={{ fontSize: '0.68rem' }}>{p}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interaction history */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 16 }}>Interaction History</h3>
        {profile.interaction_history?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
            <p>No interactions yet.</p>
            <Button variant="primary" size="sm" style={{ marginTop: 12 }} onClick={handleLogInteraction}>Log First Interaction</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(profile.interaction_history || []).map((interaction, i) => (
              <div key={interaction.id} style={{
                padding: '14px',
                borderRadius: 8,
                border: '1px solid var(--gray-200)',
                background: i === 0 ? 'var(--primary-light)' : 'var(--gray-50)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gray-800)' }}>
                      {interaction.type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 2 }}>{interaction.date}</div>
                  </div>
                  <Badge preset={interaction.compliance_status || 'pending'}>
                    {interaction.compliance_status || 'pending'}
                  </Badge>
                </div>
                {interaction.ai_summary && (
                  <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>
                    {interaction.ai_summary}
                  </p>
                )}
                {interaction.products?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                    {interaction.products.map(p => (
                      <Badge key={p} preset="primary" style={{ fontSize: '0.68rem' }}>{p}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
