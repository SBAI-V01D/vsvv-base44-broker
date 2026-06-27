/**
 * RoleGuard — Role-based route protection for 7 roles.
 *
 * Supported roles (matching rbac.js ROLES):
 *   admin, management, broker, backoffice, finance, support, compliance
 *
 * Usage (React Router v6):
 *   <Route
 *     path="/admin/users"
 *     element={
 *       <RoleGuard requiredRoles={['admin', 'management']}>
 *         <UserManagement />
 *       </RoleGuard>
 *     }
 *   />
 */
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/lib/AuthContext'
import { resolveRole, ROLES } from '@/lib/rbac'

/**
 * RoleGuard protects a route based on the user's role.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} props.requiredRoles - Roles that are allowed (OR logic)
 * @param {string} [props.redirectTo] - Where to send unauthorized users
 * @returns {React.ReactNode}
 */
export default function RoleGuard({
  children,
  requiredRoles = [],
  allowedRoles = [],
  role,
  missingRoleMessage = 'Zugriff verweigert: Unzureichende Berechtigung.',
  redirectTo = '/dashboard',
}) {
  const { user, isLoadingAuth } = useAuth()
  const location = useLocation()

  const roles = requiredRoles.length
    ? requiredRoles
    : allowedRoles.length
      ? allowedRoles
      : role
        ? Array.isArray(role)
          ? role
          : [role]
        : []

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Prüfe Berechtigungen…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate to="/login" state={{ from: location }} replace />
    )
  }

  const currentRole = resolveRole(user.role)
  const isAllowed = roles.length > 0 && roles.includes(currentRole)

  if (!isAllowed) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location, errorMessage: missingRoleMessage }}
        replace
      />
    )
  }

  return <>{children}</>
}

/**
 * RoleIndicator — Displays badge with current user role + available roles.
 */
export function RoleIndicator() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
        {ROLES[user.role]?.label || user.role}
      </span>
      {user.role_permissions && Object.entries(user.role_permissions).map(([module, accessible]) => (
        <span
          key={module}
          className="px-2 py-0.5 rounded-full text-xs"
          style={{
            backgroundColor: accessible ? '#dcfce7' : '#fee2e2',
            color: accessible ? '#166534' : '#991b1b',
          }}
        >
          {module}
        </span>
      ))}
    </div>
  )
}

/**
 * useHasRole — Hook to check role inside components.
 * Usage: const isAdmin = useHasRole('admin')
 */
export function useHasRole(role) {
  const { user } = useAuth()
  if (!user || !role) return false
  return resolveRole(user.role) === role
}

/**
 * useHasAnyRole — Check if user has at least one of the roles.
 * Usage: const canEdit = useHasAnyRole(['admin', 'management', 'broker'])
 */
export function useHasAnyRole(roles) {
  const { user } = useAuth()
  if (!user || !roles?.length) return false
  return roles.includes(resolveRole(user.role))
}

/**
 * useCanAccessModule — Check module access from role_permissions.
 * Usage: const canEditCustomers = useCanAccessModule('customers')
 */
export function useCanAccessModule(moduleName) {
  const { user } = useAuth()
  if (!user) return false
  return !!user.role_permissions?.[moduleName]
}
