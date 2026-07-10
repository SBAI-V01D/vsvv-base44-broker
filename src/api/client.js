/**
 * VSVV API Client — Drop-in replacement for @base44/sdk
 *
 * Usage: import { base44 } from '@/api/base44Client'
 *
 * This module creates a `base44`-compatible interface that talks to our
 * self-hosted Fastify backend instead of Base44's cloud API.
 *
 * ALL existing frontend code continues to work without changes.
 *
 * Supported calling patterns (matching @base44/sdk exactly):
 *   list()                    → GET /api/{entities}
 *   list(sort, pageSize)      → GET /api/{entities}?sortBy=...&limit=...
 *   list(sort, pageSize, offset) → GET /api/{entities}?sortBy=...&limit=...&page=...
 *   list(filters, limit)      → GET /api/{entities}?status=active&limit=...
 *   filter(query, sort, limit) → GET /api/{entities}?...&sortBy=...
 *   subscribe(callback)       → bridges to Socket.io for realtime
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// ─── Token Management ───────────────────────────────────────────────────────

let accessToken = localStorage.getItem('vsvv_access_token') || null
let refreshToken = localStorage.getItem('vsvv_refresh_token') || null
let refreshPromise = null

export function setTokens(access, refresh) {
  accessToken = access
  refreshToken = refresh
  if (access) localStorage.setItem('vsvv_access_token', access)
  else localStorage.removeItem('vsvv_access_token')
  if (refresh) localStorage.setItem('vsvv_refresh_token', refresh)
  else localStorage.removeItem('vsvv_refresh_token')
}

export function clearTokens() {
  setTokens(null, null)
}

export function getAccessToken() {
  return accessToken
}

// ─── Core Request Engine ────────────────────────────────────────────────────

async function request(method, path, options = {}) {
  const { body, params, headers: extraHeaders, isFormData } = options

  // Build URL with query params
  let url = `${API_BASE}${path}`
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value)
      }
    })
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
  }

  // Build headers
  const headers = {}
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }
  if (extraHeaders) {
    Object.assign(headers, extraHeaders)
  }

  // Prepare body
  let requestBody = body
  if (body && !isFormData && typeof body === 'object') {
    requestBody = JSON.stringify(body)
  }

  let response = await fetch(url, {
    method,
    headers,
    body: requestBody,
  })

  // Auto-refresh on 401
  if (response.status === 401 && refreshToken) {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          })
          if (res.ok) {
            const data = await res.json()
            setTokens(data.accessToken, data.refreshToken)
            return data.accessToken
          } else {
            clearTokens()
            window.dispatchEvent(new CustomEvent('auth:logout'))
            return null
          }
        } catch {
          clearTokens()
          window.dispatchEvent(new CustomEvent('auth:logout'))
          return null
        } finally {
          refreshPromise = null
        }
      })()
    }

    const newToken = await refreshPromise
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`
      response = await fetch(url, { method, headers, body: requestBody })
    }
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json()
    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Request failed')
      error.status = response.status
      error.data = data
      throw error
    }
    return data
  }

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`)
    error.status = response.status
    throw error
  }

  return null
}

// ─── Service-Role Proxy ─────────────────────────────────────────────────────
// Bypasses RLS for admin use. Mirrors the entity proxy but adds a service-role header.
// Used via base44.asServiceRole.entities.X.list() in hooks like useAccessControl.js

function createServiceRoleEntityProxy() {
  return new Proxy({}, {
    get(target, entityName) {
      const route = entityName
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')
        + 's'

      const methods = {
        list: (...args) => {
          let filters = {}
          let limit = 50
          let sort = '-created_at'
          let offset = 0

          if (args.length === 1) {
            if (typeof args[0] === 'string') sort = args[0]
            else if (typeof args[0] === 'object') filters = { ...args[0] }
          } else if (args.length === 2) {
            if (typeof args[0] === 'string' && typeof args[1] === 'number') {
              sort = args[0]; limit = args[1]
            } else if (typeof args[0] === 'object' && typeof args[1] === 'number') {
              filters = { ...args[0] }; limit = args[1]
            }
          }

          const params = { page: 1, limit, ...filters }
          if (typeof sort === 'string') {
            if (sort.startsWith('-')) {
              params.sortBy = sort.substring(1)
              params.sortOrder = 'desc'
            } else { params.sortBy = sort; params.sortOrder = 'asc' }
          }

          return request('GET', `/api/${route}`, {
            params,
            headers: { 'X-Service-Role': 'true' },
          }).then(res => res.data || [])
        },

        get: (id) => request('GET', `/api/${route}/${id}`, {
          headers: { 'X-Service-Role': 'true' },
        }).then(res => res.data),

        create: (data) => request('POST', `/api/${route}`, {
          body: data,
          headers: { 'X-Service-Role': 'true' },
        }).then(res => res.data),

        update: (id, data) => request('PATCH', `/api/${route}/${id}`, {
          body: data,
          headers: { 'X-Service-Role': 'true' },
        }).then(res => res.data),

        delete: (id) => request('DELETE', `/api/${route}/${id}`, {
          headers: { 'X-Service-Role': 'true' },
        }).then(res => res.data),
      }

      return methods
    },
  })
}

// ─── Socket.io Bridge ───────────────────────────────────────────────────────
// Lazy-loaded so the client works even without socket.io-client installed.

let socketIoInstance = null
let socketIoInitialized = false

async function getSocketIo() {
  if (socketIoInitialized) return socketIoInstance
  socketIoInitialized = true
  try {
    const { io } = await import('socket.io-client')
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''
    socketIoInstance = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      autoConnect: false,
    })
    // Auto-connect if we have a token
    if (accessToken) {
      socketIoInstance.auth = { token: accessToken }
      socketIoInstance.connect()
    }
  } catch {
    // Socket.io not available — subscriptions silently no-op
    socketIoInstance = null
  }
  return socketIoInstance
}

// Track active subscriptions for cleanup
const subscriptionHandlers = new Map()

// ─── Entity Proxy ───────────────────────────────────────────────────────────

function createEntityProxy() {
  return new Proxy({}, {
    get(target, entityName) {
      // Convert PascalCase to kebab-case: Customer → customers
      const route = entityName
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')
        + 's' // simple pluralization

      const entityMethods = {
        /**
         * list() — supports MULTIPLE calling patterns matching @base44/sdk:
         *
         *   list()                                    → all records, default sort
         *   list(sort, pageSize)                      → e.g. list('-created_date', 500)
         *   list(sort, pageSize, offset)              → paginated: list('-created_date', 50, 0)
         *   list({ status: 'active' }, limit)         → filter object + limit
         *   list({ filters })                         → filter object only
         */
        list: (...args) => {
          let filters = {}
          let limit = 50
          let sort = '-created_at'
          let offset = 0

          if (args.length === 0) {
            // list() — use defaults
          } else if (args.length === 1) {
            if (typeof args[0] === 'string') {
              // list('-created_date') — sort string only
              sort = args[0]
            } else if (typeof args[0] === 'object') {
              // list({ status: 'active' }) — filter object
              filters = { ...args[0] }
            }
          } else if (args.length === 2) {
            if (typeof args[0] === 'string' && typeof args[1] === 'number') {
              // list('-created_date', 500) — sort + pageSize
              sort = args[0]
              limit = args[1]
            } else if (typeof args[0] === 'object' && typeof args[1] === 'number') {
              // list({ status: 'active' }, 100) — filter + limit
              filters = { ...args[0] }
              limit = args[1]
            }
          } else if (args.length >= 3) {
            if (typeof args[0] === 'string' && typeof args[1] === 'number') {
              // list('-created_date', 50, 0) — sort + pageSize + offset
              sort = args[0]
              limit = args[1]
              offset = args[2] || 0
            } else if (typeof args[0] === 'object') {
              // fallback: treat as filter + rest
              filters = { ...args[0] }
              if (typeof args[1] === 'string') sort = args[1]
              if (typeof args[2] === 'number') limit = args[2]
            }
          }

          const params = {
            page: Math.floor(offset / limit) + 1,
            limit,
            ...filters,
          }

          // Handle Base44's string-based sort: '-field' → desc, 'field' → asc
          if (typeof sort === 'string') {
            if (sort.startsWith('-')) {
              params.sortBy = sort.substring(1)
              params.sortOrder = 'desc'
            } else {
              params.sortBy = sort
              params.sortOrder = 'asc'
            }
          }

          return request('GET', `/api/${route}`, { params })
            .then(res => res.data || [])
        },

        get: (id) => {
          return request('GET', `/api/${route}/${id}`)
            .then(res => res.data)
        },

        create: (data) => {
          return request('POST', `/api/${route}`, { body: data })
            .then(res => res.data)
        },

        update: (id, data) => {
          return request('PATCH', `/api/${route}/${id}`, { body: data })
            .then(res => res.data)
        },

        delete: (id) => {
          return request('DELETE', `/api/${route}/${id}`)
            .then(res => res.data)
        },

        /**
         * filter(query, sort, limit)
         *   query  = object of field filters (e.g. { customer_id, archived: false })
         *   sort   = '-field' for desc, 'field' for asc (optional)
         *   limit  = max results (optional)
         */
        filter: (query = {}, sort = '-created_at', limit = 50) => {
          const params = { page: 1, limit, ...query }
          if (typeof sort === 'string') {
            if (sort.startsWith('-')) {
              params.sortBy = sort.substring(1)
              params.sortOrder = 'desc'
            } else {
              params.sortBy = sort
              params.sortOrder = 'asc'
            }
          }
          return request('GET', `/api/${route}`, { params })
            .then(res => res.data || [])
        },

        /**
         * subscribe(callback) — bridges to Socket.io for realtime updates.
         *
         * callback receives: { type: 'create'|'update'|'delete', data, id }
         * Returns an unsubscribe function.
         *
         * Falls back to silent no-op if Socket.io is unavailable.
         */
        subscribe: (callback) => {
          const eventName = `entity:${entityName}:changed`
          const handler = (event) => {
            try {
              callback(event)
            } catch {
              // Never let subscription handlers crash the app
            }
          }

          // Store for cleanup
          if (!subscriptionHandlers.has(eventName)) {
            subscriptionHandlers.set(eventName, new Set())
          }
          subscriptionHandlers.get(eventName).add(handler)

          // Bridge to socket.io
          getSocketIo().then(socket => {
            if (socket) {
              socket.emit('subscribe:entity', entityName)
              socket.on(eventName, handler)
            }
          })

          // Return unsubscribe function
          return () => {
            const handlers = subscriptionHandlers.get(eventName)
            if (handlers) {
              handlers.delete(handler)
            }
            getSocketIo().then(socket => {
              if (socket) {
                socket.off(eventName, handler)
              }
            })
          }
        },
      }

      return entityMethods
    },
  })
}

// ─── Auth ───────────────────────────────────────────────────────────────────

const auth = {
  me: () => {
    return request('GET', '/api/auth/me').then(res => res.user || res)
  },

  logout: (redirectUrl) => {
    const token = refreshToken
    clearTokens()
    // Attempt to invalidate token on server (fire-and-forget)
    if (token) {
      request('POST', '/api/auth/logout', { body: { refreshToken: token } }).catch(() => {})
    }
    // Disconnect socket
    getSocketIo().then(socket => {
      if (socket) socket.disconnect()
    }).catch(() => {})
    socketIoInitialized = false
    socketIoInstance = null

    if (redirectUrl) {
      window.location.href = redirectUrl
    }
  },

  redirectToLogin: (returnUrl) => {
    const target = returnUrl ? `/login?redirect=${encodeURIComponent(returnUrl)}` : '/login'
    window.location.href = target
  },

  updateMe: (data) => {
    return request('PATCH', '/api/auth/me', { body: data }).then(res => res.user || res)
  },
}

// ─── Functions ──────────────────────────────────────────────────────────────

const functions = {
  invoke: (name, params = {}) => {
    return request('POST', `/api/functions/${name}`, { body: params })
      .then(res => res.data || res)
  },
}

// ─── Integrations ───────────────────────────────────────────────────────────

const integrations = {
  Core: {
    UploadFile: async ({ file, ...metadata }) => {
      const formData = new FormData()
      formData.append('file', file)
      if (metadata.path) formData.append('path', metadata.path)

      return request('POST', '/api/upload/file', {
        body: formData,
        isFormData: true,
      }).then(res => {
        const fileUrl = res.data?.url || res.url
        if (!fileUrl) throw new Error('upload_failed: No file URL in response')
        return { file_url: fileUrl }
      })
    },

    UploadFiles: async ({ files, ...metadata }) => {
      const formData = new FormData()
      files.forEach((file, i) => formData.append(`file_${i}`, file))
      if (metadata.path) formData.append('path', metadata.path)

      return request('POST', '/api/upload/files', {
        body: formData,
        isFormData: true,
      }).then(res => ({ uploaded_files: res.files || res.data || [] }))
    },

    /**
     * SendEmail — matches base44.integrations.Core.SendEmail({ to, subject, body })
     * Used in src/lib/notifications.js
     */
    SendEmail: async ({ to, subject, body, ...rest }) => {
      return request('POST', '/api/integrations/email/send', {
        body: { to, subject, body, ...rest },
      }).then(res => res.data || res)
    },
  },
}

// ─── Main Export ────────────────────────────────────────────────────────────

/**
 * The main base44-compatible export.
 *
 * Usage: import { base44 } from '@/api/base44Client'
 *
 * Every method matches @base44/sdk's interface so all 213+ existing
 * component files work without changes.
 */
export const base44 = {
  entities: createEntityProxy(),
  asServiceRole: {
    entities: createServiceRoleEntityProxy(),
  },
  auth,
  functions,
  integrations,
}

// Listen for forced logout events (e.g., from token refresh failure)
window.addEventListener('auth:logout', () => {
  window.dispatchEvent(new CustomEvent('vsvv:logout'))
})

export default base44
