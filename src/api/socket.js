/**
 * avaai Socket.io Client — replaces avaai subscriptions.
 *
 * Usage:
 *   import { socket } from '@/api/socket'
 *   socket.emit('subscribe:entity', 'Customer')
 *   socket.on('entity:Customer:changed', (data) => { ... })
 */

import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

let socket = null
let reconnectTimer = null

function getToken() {
  return localStorage.getItem('avaai_access_token')
}

export function getSocket() {
  const token = getToken()

  if (!socket || !socket.connected) {
    if (socket) socket.removeAllListeners()
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 20,
    })

    socket.on('reconnect_attempt', () => {
      socket.auth = { token: getToken() }
    })

    socket.on('reconnect_error', () => {
      clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(() => {
        if (socket && !socket.connected) {
          socket.auth = { token: getToken() }
          socket.connect()
        }
      }, 5000)
    })

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        clearTimeout(reconnectTimer)
        reconnectTimer = setTimeout(() => {
          socket.auth = { token: getToken() }
          socket.connect()
        }, 3000)
      }
    })
  }

  return socket
}

export function connectSocket() {
  const s = getSocket()
  if (!s.connected) {
    s.auth = { token: getToken() }
    s.connect()
  }
  return s
}

export function disconnectSocket() {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}

// Reconnect on auth change
window.addEventListener('auth:token-refreshed', () => {
  if (socket && !socket.connected) {
    socket.auth = { token: getToken() }
    socket.connect()
  }
})

export default { getSocket, connectSocket, disconnectSocket }
