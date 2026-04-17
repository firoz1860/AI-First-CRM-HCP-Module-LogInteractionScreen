import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { interactionService } from '../../services/interactionService'

export const fetchInteractions = createAsyncThunk(
  'interactions/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await interactionService.list(params)
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

export const createInteraction = createAsyncThunk(
  'interactions/create',
  async (data, { rejectWithValue }) => {
    try {
      return await interactionService.create(data)
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

export const updateInteraction = createAsyncThunk(
  'interactions/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await interactionService.update(id, data)
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

export const deleteInteraction = createAsyncThunk(
  'interactions/delete',
  async (id, { rejectWithValue }) => {
    try {
      await interactionService.remove(id)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

const interactionsSlice = createSlice({
  name: 'interactions',
  initialState: {
    list: [],
    current: null,
    loading: false,
    submitting: false,
    error: null,
    aiSummary: null,
    complianceResult: null,
    nextAction: null,
    submitSuccess: false,
  },
  reducers: {
    setCurrent(state, action) {
      state.current = action.payload
    },
    clearSubmitState(state) {
      state.aiSummary = null
      state.complianceResult = null
      state.nextAction = null
      state.submitSuccess = false
      state.error = null
    },
    setNextAction(state, action) {
      state.nextAction = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInteractions.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchInteractions.fulfilled, (state, action) => { state.loading = false; state.list = action.payload })
      .addCase(fetchInteractions.rejected, (state, action) => { state.loading = false; state.error = action.payload })

      .addCase(createInteraction.pending, (state) => { state.submitting = true; state.error = null })
      .addCase(createInteraction.fulfilled, (state, action) => {
        state.submitting = false
        state.submitSuccess = true
        state.current = action.payload
        state.aiSummary = action.payload.ai_summary
        state.complianceResult = {
          status: action.payload.compliance_status,
          notes: action.payload.compliance_notes,
        }
        state.list.unshift(action.payload)
      })
      .addCase(createInteraction.rejected, (state, action) => { state.submitting = false; state.error = action.payload })

      .addCase(updateInteraction.fulfilled, (state, action) => {
        state.current = action.payload
        const idx = state.list.findIndex(i => i.id === action.payload.id)
        if (idx !== -1) state.list[idx] = action.payload
      })

      .addCase(deleteInteraction.fulfilled, (state, action) => {
        state.list = state.list.filter(i => i.id !== action.payload)
      })
  },
})

export const { setCurrent, clearSubmitState, setNextAction } = interactionsSlice.actions
export default interactionsSlice.reducer
