const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

class ChatWebSocketManager {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnects = 5
    this.listeners = {}
    this.sessionId = null
    this.hcpId = null
    this.reconnectTimer = null
  }

  connect(sessionId, hcpId) {
    this.sessionId = sessionId
    this.hcpId = hcpId
    this._connect()
  }

  _connect() {
    if (this.ws) {
      this.ws.close()
    }

    const url = `${WS_BASE}/api/chat/ws/chat/${this.sessionId}`
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this._emit('connected', true)
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this._emit('message', data)
      } catch (e) {
        console.error('WS parse error', e)
      }
    }

    this.ws.onclose = () => {
      this._emit('connected', false)
      this._scheduleReconnect()
    }

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err)
      this._emit('error', err)
    }
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnects) return
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++
    this.reconnectTimer = setTimeout(() => this._connect(), delay)
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ message, hcp_id: this.hcpId }))
      return true
    }
    return false
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(callback)
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  _emit(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data))
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
    this._emit('connected', false)
  }
}

export const chatWebSocket = new ChatWebSocketManager()

export const chatService = {
  sendMessage: (data) =>
    fetch(`${API_BASE}/api/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
  getSession: (id) =>
    fetch(`${API_BASE}/api/chat/session/${id}`).then(r => r.json()),
}
