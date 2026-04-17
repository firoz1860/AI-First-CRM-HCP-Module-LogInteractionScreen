import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import ToastContainer from './components/ui/Toast'
import Dashboard from './features/dashboard/Dashboard'
import HCPList from './features/hcp/HCPList'
import HCPProfile from './features/hcp/HCPProfile'
import LogInteractionScreen from './features/interactions/LogInteractionScreen'
import InteractionHistory from './features/interactions/InteractionHistory'

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={
          <AppLayout title="Dashboard">
            <Dashboard />
          </AppLayout>
        } />
        <Route path="/hcps" element={
          <AppLayout title="HCP Directory">
            <HCPList />
          </AppLayout>
        } />
        <Route path="/hcps/:id" element={
          <AppLayout title="HCP Profile">
            <HCPProfile />
          </AppLayout>
        } />
        <Route path="/interactions/new" element={
          <AppLayout title="Log Interaction">
            <LogInteractionScreen />
          </AppLayout>
        } />
        <Route path="/interactions" element={
          <AppLayout title="Interaction History">
            <InteractionHistory />
          </AppLayout>
        } />
      </Routes>
    </BrowserRouter>
  )
}
