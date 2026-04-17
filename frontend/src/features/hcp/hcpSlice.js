import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { hcpService } from '../../services/hcpService'

export const fetchHCPs = createAsyncThunk(
  'hcp/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await hcpService.list(params)
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

export const fetchHCPProfile = createAsyncThunk(
  'hcp/fetchProfile',
  async (id, { rejectWithValue }) => {
    try {
      return await hcpService.getById(id)
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

export const createHCP = createAsyncThunk(
  'hcp/create',
  async (data, { rejectWithValue }) => {
    try {
      return await hcpService.create(data)
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

const hcpSlice = createSlice({
  name: 'hcp',
  initialState: {
    selected: null,
    list: [],
    profile: null,
    loading: false,
    error: null,
  },
  reducers: {
    selectHCP(state, action) {
      state.selected = action.payload
    },
    clearProfile(state) {
      state.profile = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHCPs.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchHCPs.fulfilled, (state, action) => { state.loading = false; state.list = action.payload })
      .addCase(fetchHCPs.rejected, (state, action) => { state.loading = false; state.error = action.payload })

      .addCase(fetchHCPProfile.pending, (state) => { state.loading = true })
      .addCase(fetchHCPProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profile = action.payload
        state.selected = action.payload
      })
      .addCase(fetchHCPProfile.rejected, (state, action) => { state.loading = false; state.error = action.payload })

      .addCase(createHCP.fulfilled, (state, action) => {
        state.list.unshift(action.payload)
      })
  },
})

export const { selectHCP, clearProfile } = hcpSlice.actions
export default hcpSlice.reducer
