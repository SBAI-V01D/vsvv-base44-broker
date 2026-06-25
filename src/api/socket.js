/**
 * VSVV Socket.io Client — replaces Base44 subscriptions.
 *
 * Usage:
 *   import { socket } from '@/api/socket'
 *   socket.emit('subscribe:entity', 'Customer')
 *   socket.on('entity:Customer:changed', (data) => { ... })
 */

import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

let socket = null

export function getSocket() {
  const token = localStorage.getItem('vsvv_access_token')

  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: false,
    })
  }

  return socket
}

export function connectSocket() {
  const s = getSocket()
  if (!s.connected) {
    const token = localStorage.getItem('vsvv_access_token')
    s.auth = { token }
    s.connect()
  }
  return s
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Default export for convenience
export default { getSocket, connectSocket, disconnectSocket }
