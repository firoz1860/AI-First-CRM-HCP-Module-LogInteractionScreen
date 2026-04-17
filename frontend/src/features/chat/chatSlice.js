import { createSlice } from '@reduxjs/toolkit'

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    sessionId: null,
    messages: [],
    isConnected: false,
    isTyping: false,
    toolExecuting: null,
    streamingContent: '',
    error: null,
  },
  reducers: {
    setSessionId(state, action) {
      state.sessionId = action.payload
    },
    addMessage(state, action) {
      state.messages.push({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      })
      state.streamingContent = ''
    },
    appendStream(state, action) {
      state.streamingContent += action.payload
    },
    setConnected(state, action) {
      state.isConnected = action.payload
    },
    setTyping(state, action) {
      state.isTyping = action.payload
    },
    setToolExecuting(state, action) {
      state.toolExecuting = action.payload
    },
    clearChat(state) {
      state.messages = []
      state.sessionId = null
      state.streamingContent = ''
    },
    setError(state, action) {
      state.error = action.payload
    },
    handleAgentMessage(state, action) {
      const data = action.payload
      switch (data.type) {
        case 'typing':
          state.isTyping = true
          state.toolExecuting = null
          break
        case 'tool_start':
          state.toolExecuting = data.tool
          state.isTyping = false
          break
        case 'tool_end':
          state.toolExecuting = null
          break
        case 'stream':
          state.isTyping = false
          state.streamingContent += data.content
          break
        case 'done':
          state.isTyping = false
          state.toolExecuting = null
          if (state.streamingContent) {
            state.messages.push({
              id: Date.now(),
              role: 'assistant',
              content: state.streamingContent,
              timestamp: new Date().toISOString(),
            })
            state.streamingContent = ''
          }
          break
        case 'error':
          state.isTyping = false
          state.toolExecuting = null
          state.error = data.content
          break
        default:
          break
      }
    },
  },
})

export const {
  setSessionId, addMessage, appendStream, setConnected,
  setTyping, setToolExecuting, clearChat, setError, handleAgentMessage,
} = chatSlice.actions
export default chatSlice.reducer
