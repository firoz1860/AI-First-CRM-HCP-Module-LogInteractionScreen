import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { toggleMobileSidebar, setSidebarOpen } from '../../features/ui/uiSlice'

export default function AppLayout({ children, title }) {
  const dispatch = useDispatch()
  const sidebarOpen = useSelector(s => s.ui.sidebarOpen)
  const mobileSidebarOpen = useSelector(s => s.ui.mobileSidebarOpen)

  // Auto-collapse sidebar on tablet/mobile on mount
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        dispatch(setSidebarOpen(false))
      } else {
        dispatch(setSidebarOpen(true))
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [dispatch])

  return (
    <div className="app-shell">
      {/* ── Desktop sidebar ── */}
      <div
        className={`sidebar-wrapper${sidebarOpen ? '' : ' collapsed'}`}
        style={{ display: 'flex' }}
      >
        <Sidebar />
      </div>

      {/* ── Mobile overlay backdrop ── */}
      {mobileSidebarOpen && (
        <div
          className="mobile-overlay"
          style={{ display: 'block' }}
          onClick={() => dispatch(toggleMobileSidebar())}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div
        className={`mobile-sidebar-drawer${mobileSidebarOpen ? ' open' : ''}`}
        style={{ display: 'block' }}
      >
        <Sidebar mobile />
      </div>

      {/* ── Main content ── */}
      <div className="main-content">
        <TopBar title={title} />
        <main className="page-content fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
