import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { fetchHCPs, selectHCP } from './hcpSlice'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'

export default function HCPList() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { list, loading } = useSelector(s => s.hcp)
  const [search, setSearch] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [tierFilter, setTierFilter] = useState('')

  useEffect(() => {
    dispatch(fetchHCPs())
  }, [dispatch])

  const filtered = list.filter(hcp => {
    const matchSearch = !search || hcp.name?.toLowerCase().includes(search.toLowerCase()) ||
      hcp.institution?.toLowerCase().includes(search.toLowerCase())
    const matchSpecialty = !specialtyFilter || hcp.specialty === specialtyFilter
    const matchTier = !tierFilter || hcp.tier === tierFilter
    return matchSearch && matchSpecialty && matchTier
  })

  const specialties = [...new Set(list.map(h => h.specialty).filter(Boolean))]

  const handleLogInteraction = (hcp) => {
    dispatch(selectHCP(hcp))
    navigate('/interactions/new')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)' }}>HCP Directory</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: 2 }}>
            {filtered.length} of {list.length} healthcare professionals
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card filter-bar" style={{ padding: '14px 16px' }}>
        <input
          className="form-input"
          placeholder="🔍  Search HCPs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280, flex: '2 1 180px' }}
        />
        <select
          className="form-select"
          value={specialtyFilter}
          onChange={e => setSpecialtyFilter(e.target.value)}
          style={{ maxWidth: 180, flex: '1 1 130px' }}
        >
          <option value="">All Specialties</option>
          {specialties.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="form-select"
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
          style={{ maxWidth: 130, flex: '1 1 100px' }}
        >
          <option value="">All Tiers</option>
          <option value="A">Tier A</option>
          <option value="B">Tier B</option>
          <option value="C">Tier C</option>
        </select>
        {(search || specialtyFilter || tierFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSpecialtyFilter(''); setTierFilter('') }}>
            Clear
          </Button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="hcp-grid">
          {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--gray-400)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>👨‍⚕️</div>
          <p style={{ fontWeight: 500 }}>No HCPs found</p>
          <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="hcp-grid">
          {filtered.map(hcp => (
            <div key={hcp.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 44, height: 44,
                  background: 'var(--primary)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '1rem',
                  flexShrink: 0,
                }}>
                  {hcp.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {hcp.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 1 }}>{hcp.specialty}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hcp.institution}</div>
                </div>
                <Badge preset={`tier-${hcp.tier}`}>Tier {hcp.tier}</Badge>
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                <span>📊 {hcp.total_interactions || 0} visits</span>
                <span>✅ {hcp.compliance_rate || 0}%</span>
                {hcp.territory && <span>📍 {hcp.territory}</span>}
              </div>

              {hcp.top_products?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {hcp.top_products.map(p => (
                    <Badge key={p} preset="primary" style={{ fontSize: '0.68rem' }}>{p}</Badge>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <Button variant="primary" size="sm" style={{ flex: 1 }} onClick={() => handleLogInteraction(hcp)}>
                  Log Visit
                </Button>
                <Link to={`/hcps/${hcp.id}`}>
                  <Button variant="secondary" size="sm">Profile</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
