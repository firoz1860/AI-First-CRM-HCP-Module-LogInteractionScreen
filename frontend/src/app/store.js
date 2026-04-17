import { configureStore } from '@reduxjs/toolkit'
import interactionsReducer from '../features/interactions/interactionsSlice'
import hcpReducer from '../features/hcp/hcpSlice'
import chatReducer from '../features/chat/chatSlice'
import uiReducer from '../features/ui/uiSlice'
import dashboardReducer from '../features/dashboard/dashboardSlice'

export const store = configureStore({
  reducer: {
    interactions: interactionsReducer,
    hcp: hcpReducer,
    chat: chatReducer,
    ui: uiReducer,
    dashboard: dashboardReducer,
  },
})
