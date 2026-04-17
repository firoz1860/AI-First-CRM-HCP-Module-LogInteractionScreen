import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    mode: 'form',          // 'form' | 'chat'
    sidebarOpen: true,
    activeToasts: [],
    mobileSidebarOpen: false,
  },
  reducers: {
    setMode(state, action) {
      state.mode = action.payload
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload
    },
    toggleMobileSidebar(state) {
      state.mobileSidebarOpen = !state.mobileSidebarOpen
    },
    addToast(state, action) {
      const toast = { id: Date.now(), ...action.payload }
      state.activeToasts.push(toast)
    },
    removeToast(state, action) {
      state.activeToasts = state.activeToasts.filter(t => t.id !== action.payload)
    },
  },
})

export const { setMode, toggleSidebar, setSidebarOpen, toggleMobileSidebar, addToast, removeToast } = uiSlice.actions
export default uiSlice.reducer
