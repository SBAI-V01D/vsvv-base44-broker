/**
 * Login — Authentifizierung
 *
 * Email + Passwort Formular.
 * Nach erfolgreichem Login wird zu ?redirect= oder / weitergeleitet.
 */
import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { Shield, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login, currentUser, isLoadingAuth } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const redirectTo = searchParams.get('redirect') || '/'

  // Bereits eingeloggt? → Weiterleitung
  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      navigate(redirectTo, { replace: true })
    }
  }, [isLoadingAuth, currentUser, navigate, redirectTo])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      setError('Bitte Email und Passwort eingeben')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const user = await login(email, password)
      if (user) {
        navigate(redirectTo, { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Login fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (currentUser) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-indigo-100/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-4">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-200/50 mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            VSVV Premium Broker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bitte melden Sie sich an
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-border shadow-xl p-8 space-y-5"
        >
          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="ihre@email.ch"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white/80 text-sm 
                         placeholder:text-muted-foreground/50
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                         transition-all"
              autoFocus
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Passwort
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-white/80 text-sm
                           placeholder:text-muted-foreground/50
                           focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                           transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white
                       text-sm font-bold shadow-md shadow-blue-200/50
                       hover:from-blue-700 hover:to-indigo-700 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Anmelden…
              </span>
            ) : (
              'Anmelden'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
