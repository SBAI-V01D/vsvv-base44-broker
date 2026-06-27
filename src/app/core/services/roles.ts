
/**
 * All 7 supported roles in the Premium Broker application.
 * Hierarchy: superadmin > admin > manager > underwriter > broker > support > analytics
 */

export type UserRole =
  | 'superadmin'
  | 'admin'
  | 'manager'
  | 'broker'
  | 'underwriter'
  | 'support'
  | 'analytics';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  superadmin: 6,
  admin: 5,
  manager: 4,
  underwriter: 3,
  broker: 2,
  support: 1,
  analytics: 0,
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super Administrator',
  admin: 'Administrator',
  manager: 'Manager',
  broker: 'Broker',
  underwriter: 'Underwriter',
  support: 'Support Agent',
  analytics: 'Analytics',
} as const;

export const DEFAULT_ROLE: UserRole = 'broker';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  superadmin: [
    'users.create', 'users.read', 'users.update', 'users.delete',
    'contracts.create', 'contracts.read', 'contracts.update', 'contracts.delete',
    'customers.create', 'customers.read', 'customers.update', 'customers.delete',
    'applications.create', 'applications.read', 'applications.update', 'applications.delete',
    'commissions.read', 'commissions.create',
    'documents.read', 'documents.upload', 'documents.delete',
    'leads.read', 'leads.assign', 'leads.convert',
    'tasks.create', 'tasks.read', 'tasks.update',
    'reports.generate', 'reports.view',
    'settings.view', 'settings.update',
    'migration.run',
  ],
  admin: [
    'users.read', 'users.update',
    'contracts.create', 'contracts.read', 'contracts.update', 'contracts.delete',
    'customers.create', 'customers.read', 'customers.update', 'customers.delete',
    'applications.create', 'applications.read', 'applications.update', 'applications.delete',
    'commissions.read', 'commissions.create',
    'documents.read', 'documents.upload', 'documents.delete',
    'leads.read', 'leads.assign', 'leads.convert',
    'tasks.create', 'tasks.read', 'tasks.update',
    'reports.generate', 'reports.view',
    'settings.view', 'settings.update',
    'migration.run',
  ],
  manager: [
    'contracts.read', 'contracts.update', 'contracts.delete',
    'customers.create', 'customers.read', 'customers.update', 'customers.delete',
    'applications.create', 'applications.read', 'applications.update', 'applications.delete',
    'commissions.read',
    'documents.read', 'documents.upload',
    'leads.read', 'leads.convert',
    'tasks.create', 'tasks.read', 'tasks.update',
    'reports.generate', 'reports.view',
    'settings.view',
  ],
  underwriter: [
    'contracts.create', 'contracts.read', 'contracts.update',
    'customers.read',
    'applications.create', 'applications.read', 'applications.update', 'applications.delete',
    'commissions.read',
    'documents.read', 'documents.upload',
    'leads.read', 'leads.assign',
    'tasks.create', 'tasks.read', 'tasks.update',
    'reports.generate',
    'settings.view',
  ],
  broker: [
    'customers.create', 'customers.read', 'customers.update',
    'contracts.create', 'contracts.read', 'contracts.update',
    'applications.create', 'applications.read', 'applications.update',
    'commissions.read',
    'documents.read', 'documents.upload',
    'leads.read', 'leads.assign',
    'tasks.create', 'tasks.read', 'tasks.update',
    'reports.view',
    'settings.view',
  ],
  support: [
    'customers.read', 'customers.update',
    'contracts.read', 'contracts.update',
    'applications.read', 'applications.update',
    'commissions.read',
    'documents.read',
    'leads.read',
    'tasks.read',
    'reports.view',
    'settings.view',
  ],
  analytics: [
    'customers.read',
    'contracts.read',
    'applications.read',
    'commissions.read',
    'documents.read',
    'leads.read',
    'tasks.read',
    'reports.generate',
    'reports.view',
  ],
};

/** Check if user's role can access a permission string */
export function canAccess(userRoles: UserRole | UserRole[], permission: string): boolean {
  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
  return roles.some((r) => ROLE_PERMISSIONS[r]?.includes(permission));
}

/** Check if user has at least one of the required roles */
export function hasAnyRole(userRoles: UserRole | UserRole[], requiredRoles: UserRole[]): boolean {
  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
  return roles.some((r) => requiredRoles.includes(r));
}

/** Check if user has ALL required roles */
export function hasAllRoles(userRoles: UserRole | UserRole[], requiredRoles: UserRole[]): boolean {
  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
  return requiredRoles.every((r) => roles.includes(r));
}

/** Compare roles by hierarchy level (higher = win) */
export function compareRoles(a: UserRole, b: UserRole): number {
  return (ROLE_HIERARCHY[a] ?? -1) - (ROLE_HIERARCHY[b] ?? -1);
}

export function roleIsHigher(a: UserRole, b: UserRole): boolean {
  return compareRoles(a, b) > 0;
}

export function userCanEdit(userRole: UserRole): boolean {
  return hasAnyRole(userRole, ['superadmin', 'admin', 'manager']);
}

export function usersCanManage(userRole: UserRole): boolean {
  return hasAnyRole(userRole, ['superadmin', 'admin']);
}

export function usersCanDelete(userRole: UserRole): boolean {
  return hasAnyRole(userRole, ['superadmin', 'admin', 'manager']);
}

/** Type guard for UserRole */
export function isUserRole(value: string): value is UserRole {
  return (Object.keys(ROLE_LABELS) as UserRole[]).includes(value as UserRole);
}