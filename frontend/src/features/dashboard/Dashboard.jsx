import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchDashboardData } from './dashboardSlice'
import Badge from '../../components/ui/Badge'
import { SkeletonCard } from '../../components/ui/Skeleton'

function MetricCard({ label, value, sub, color = 'var(--primary)', icon }) {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--gray-900)' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.75rem', color }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const dispatch = useDispatch()
  const { interactions, pendingActions, loading } = useSelector(s => s.dashboard)

  useEffect(() => {
    dispatch(fetchDashboardData())
  }, [dispatch])

  // Compute metrics
  const now = new Date()
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

  const thisWeek = interactions.filter(i => new Date(i.interaction_date) >= weekAgo).length
  const thisMonth = interactions.filter(i => new Date(i.interaction_date) >= monthAgo).length
  const compliant = interactions.filter(i => i.compliance_status === 'compliant').length
  const complianceRate = interactions.length > 0 ? Math.round(compliant / interactions.length * 100) : 0

  // Top HCPs
  const hcpCounts = {}
  interactions.forEach(i => {
    if (!hcpCounts[i.hcp_id]) hcpCounts[i.hcp_id] = { count: 0, name: i.hcp_name || 'Unknown', specialty: i.hcp_specialty }
    hcpCounts[i.hcp_id].count++
  })
  const topHCPs = Object.values(hcpCounts).sort((a, b) => b.count - a.count).slice(0, 5)

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease-out' }}>
      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <MetricCard label="Interactions This Week" value={thisWeek} sub="+12% vs last week" color="var(--primary)" icon="📅" />
        <MetricCard label="Interactions This Month" value={thisMonth} sub="30-day rolling" color="var(--success)" icon="📈" />
        <MetricCard label="Compliance Rate" value={`${complianceRate}%`} sub={`${compliant} compliant`} color={complianceRate >= 90 ? 'var(--success)' : 'var(--warning)'} icon="✅" />
        <MetricCard label="Open Follow-ups" value={pendingActions.length} sub="Action required" color="var(--warning)" icon="🔔" />
      </div>

      <div className="dashboard-sections">
        {/* Recent Interactions */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--gray-800)' }}>Recent Interactions</h2>
            <Link to="/interactions" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {interactions.slice(0, 6).map(interaction => (
              <div key={interaction.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0',
                borderBottom: '1px solid var(--gray-100)',
              }}>
                <div style={{
                  width: 36, height: 36,
                  background: 'var(--primary-light)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)',
                  flexShrink: 0,
                }}>
                  {(interaction.hcp_name || 'U').charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {interaction.hcp_name || 'Unknown HCP'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                    {interaction.interaction_type?.replace('_', ' ')} · {interaction.interaction_date}
                  </div>
                </div>
                <Badge preset={interaction.compliance_status || 'pending'}>
                  {interaction.compliance_status || 'pending'}
                </Badge>
              </div>
            ))}
            {interactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                No interactions yet.{' '}
                <Link to="/interactions/new" style={{ color: 'var(--primary)' }}>Log your first one</Link>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top HCPs */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--gray-800)' }}>Top HCPs by Activity</h2>
              <Link to="/hcps" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>View all →</Link>
            </div>
            {topHCPs.length === 0 ? (
              <div style={{ color: 'var(--gray-400)', fontSize: '0.875rem', textAlign: 'center', padding: '16px 0' }}>No data yet</div>
            ) : (
              topHCPs.map((hcp, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--primary)', color: 'white',
                    fontSize: '0.7rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hcp.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{hcp.specialty}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>{hcp.count} visits</span>
                </div>
              ))
            )}
          </div>

          {/* Upcoming Follow-ups */}
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--gray-800)', marginBottom: 14 }}>Upcoming Follow-ups</h2>
            {pendingActions.length === 0 ? (
              <div style={{ color: 'var(--gray-400)', fontSize: '0.875rem', textAlign: 'center', padding: '16px 0' }}>No pending actions</div>
            ) : (
              pendingActions.slice(0, 4).map(action => (
                <div key={action.id} style={{
                  padding: '10px 0',
                  borderBottom: '1px solid var(--gray-100)',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <Badge preset={action.priority}>{action.priority}</Badge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {action.action_type?.replace('_', ' ')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Due: {action.due_date}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 16 }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/interactions/new" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px',
            background: 'var(--primary)',
            color: 'white',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
          }}>✏️ Log New Interaction</Link>
          <Link to="/hcps" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px',
            background: 'var(--gray-100)',
            color: 'var(--gray-700)',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
          }}>👨‍⚕️ Browse HCPs</Link>
          <Link to="/interactions" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px',
            background: 'var(--gray-100)',
            color: 'var(--gray-700)',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
          }}>📋 View All Interactions</Link>
        </div>
      </div>
    </div>
  )
}
