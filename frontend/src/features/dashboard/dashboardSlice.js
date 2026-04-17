import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const [interactionsRes, actionsRes] = await Promise.all([
        api.get('/api/interactions/', { params: { limit: 100 } }),
        api.get('/api/actions/', { params: { status: 'pending', limit: 20 } }),
      ])
      return {
        interactions: interactionsRes.data,
        pendingActions: actionsRes.data,
      }
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    interactions: [],
    pendingActions: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => { state.loading = true })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false
        state.interactions = action.payload.interactions
        state.pendingActions = action.payload.pendingActions
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export default dashboardSlice.reducer
