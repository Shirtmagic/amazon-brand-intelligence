/**
 * Renuv Amazon Intelligence Permission System
 * V1: Read-only portal with basic permission checks
 */

export type RenuvPermission = 
  | 'renuv:view:client-portal'
  | 'renuv:view:internal-workspace'
  | 'renuv:view:all-brands'
  | 'renuv:export:reports'
  | 'renuv:admin:access';

export type UserRole = 'admin' | 'client' | 'internal' | 'guest';

export interface PermissionContext {
  userId?: string;
  role: UserRole;
  brandId?: string;
  sessionId?: string;
}

/**
 * Permission matrix
 * V1 simplification: client sees only their brand, internal sees all
 */
const permissionMatrix: Record<UserRole, RenuvPermission[]> = {
  admin: [
    'renuv:view:client-portal',
    'renuv:view:internal-workspace',
    'renuv:view:all-brands',
    'renuv:export:reports',
    'renuv:admin:access'
  ],
  internal: [
    'renuv:view:client-portal',
    'renuv:view:internal-workspace',
    'renuv:view:all-brands',
    'renuv:export:reports'
  ],
  client: [
    'renuv:view:client-portal',
    'renuv:export:reports'
  ],
  guest: []
};

/**
 * Check if user has permission
 */
export function hasPermission(
  context: PermissionContext,
  permission: RenuvPermission
): boolean {
  const userPermissions = permissionMatrix[context.role] || [];
  return userPermissions.includes(permission);
}

/**
 * Check if user can access a specific brand
 */
export function canAccessBrand(
  context: PermissionContext,
  brandId: string
): boolean {
  // Admins and internal users can see all brands
  if (hasPermission(context, 'renuv:view:all-brands')) {
    return true;
  }

  // Clients can only see their own brand
  if (context.role === 'client') {
    return context.brandId === brandId;
  }

  return false;
}

/**
 * Get accessible brands for user
 * V1: Returns all brands for internal/admin, single brand for client
 */
export function getAccessibleBrands(
  context: PermissionContext,
  allBrands: string[]
): string[] {
  if (hasPermission(context, 'renuv:view:all-brands')) {
    return allBrands;
  }

  if (context.brandId && allBrands.includes(context.brandId)) {
    return [context.brandId];
  }

  return [];
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  timestamp: string;
  userId?: string;
  action: string;
  resource: string;
  brandId?: string;
  success: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Log permission check for audit trail
 */
export function logPermissionCheck(
  context: PermissionContext,
  permission: RenuvPermission,
  granted: boolean
): AuditLogEntry {
  return {
    timestamp: new Date().toISOString(),
    userId: context.userId,
    action: 'permission-check',
    resource: permission,
    brandId: context.brandId,
    success: granted,
    metadata: {
      role: context.role,
      sessionId: context.sessionId
    }
  };
}

/**
 * Permission errors
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public permission: RenuvPermission,
    public context: PermissionContext
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Assert permission or throw
 */
export function assertPermission(
  context: PermissionContext,
  permission: RenuvPermission
): void {
  const granted = hasPermission(context, permission);
  logPermissionCheck(context, permission, granted);

  if (!granted) {
    throw new PermissionError(
      `Permission denied: ${permission}`,
      permission,
      context
    );
  }
}
