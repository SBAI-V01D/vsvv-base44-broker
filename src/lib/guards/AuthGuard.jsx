/**
 * AuthGuard — Protects routes that require authentication.
 *
 * Usage (React Router v6):
 *   <Route
 *     path="/dashboard"
 *     element={
 *       <AuthGuard>
 *         <DashboardPage />
 *       </AuthGuard>
 *     }
 *   />
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { resolveRole } from '@/lib/rbac'

/**
 * AuthGuard protects a route so that only authenticated users can access it.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The child elements to render if authenticated
 * @param {string[]} [props.redirectTo=['/login']] - Where to redirect if unauthenticated
 * @returns {React.ReactNode}
 */
export default function AuthGuard({ children, redirectTo = ['/login'] }) {
  const { isAuthenticated, isLoadingAuth, user } = useAuth()
  const location = useLocation()

  // While the auth state is still being checked, render nothing or a spinner
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Prüfe Authentifizierung…</p>
        </div>
      </div>
    )
  }

  // Not authenticated → redirect
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    )
  }

  return <>{children}</>
}

/**
 * GuestGuard — Protect routes that should only be accessible to unauthenticated users.
 * Used for login/register pages. Redirects to dashboard if already logged in.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.redirectTo='/dashboard']
 * @returns {React.ReactNode}
 */
export function GuestGuard({ children, redirectTo = '/dashboard' }) {
  const { isAuthenticated, isLoadingAuth } = useAuth()
  const location = useLocation()

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    const from = location.state?.from
    return <Navigate to={from || redirectTo} replace />
  }

  return <>{children}</>
}

/**
 * Check if the current user needs to complete registration before proceeding.
 */
export function useUserRegistration() {
  const { user } = useAuth()
  if (!user) return true // unregistered when no user
  return !!user.isRegistered
}
