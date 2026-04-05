'use client';

import { type ReactNode } from 'react';

/**
 * User role types for Renuv Amazon Intelligence
 * - internal: Full access (August, internal team)
 * - client: Limited access (brand client portal view)
 */
export type UserRole = 'internal' | 'client';

export interface AuthGuardProps {
  /**
   * Required role(s) to view the content
   * Can be a single role or array of allowed roles
   */
  requiredRole: UserRole | UserRole[];
  
  /**
   * Content to render when user has permission
   */
  children: ReactNode;
  
  /**
   * Optional fallback content when permission denied
   * If not provided, renders nothing (null)
   */
  fallback?: ReactNode;
  
  /**
   * Optional: override the current user role check
   * Useful for testing or preview modes
   */
  currentRole?: UserRole;
}

/**
 * Get the current user's role
 * V1: Defaults to 'client' for safety (most restrictive)
 * TODO: Integrate with actual auth system when available
 */
function getCurrentUserRole(): UserRole {
  // V1 IMPLEMENTATION: Default to client role
  // This ensures internal-only content is hidden by default
  // Override via AuthGuard's currentRole prop for testing
  
  // Future: Check session storage, auth token, or API
  // const session = getSession();
  // return session?.role || 'client';
  
  return 'client';
}

/**
 * Check if user has required role
 */
function hasRequiredRole(
  currentRole: UserRole,
  requiredRole: UserRole | UserRole[]
): boolean {
  const required = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return required.includes(currentRole);
}

/**
 * AuthGuard - Role-based access control wrapper
 * 
 * Wrap internal-only content to prevent client visibility:
 * 
 * @example
 * ```tsx
 * <AuthGuard requiredRole="internal">
 *   <InternalMetricsPanel />
 * </AuthGuard>
 * ```
 * 
 * @example With fallback
 * ```tsx
 * <AuthGuard 
 *   requiredRole="internal"
 *   fallback={<div>Access restricted</div>}
 * >
 *   <AdminControls />
 * </AuthGuard>
 * ```
 * 
 * @example Multiple allowed roles
 * ```tsx
 * <AuthGuard requiredRole={['internal', 'client']}>
 *   <PublicContent />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  requiredRole,
  children,
  fallback = null,
  currentRole
}: AuthGuardProps) {
  const role = currentRole ?? getCurrentUserRole();
  const hasAccess = hasRequiredRole(role, requiredRole);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Hook to get current user role
 * Useful for conditional rendering logic within components
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const role = useUserRole();
 *   const isInternal = role === 'internal';
 *   
 *   return (
 *     <div>
 *       {isInternal && <InternalBadge />}
 *       <PublicContent />
 *     </div>
 *   );
 * }
 * ```
 */
export function useUserRole(): UserRole {
  // V1: Static role
  // Future: Use context or auth hook
  return getCurrentUserRole();
}

/**
 * Hook to check if user has specific role(s)
 * 
 * @example
 * ```tsx
 * function ToolbarActions() {
 *   const isInternal = useHasRole('internal');
 *   
 *   return (
 *     <div>
 *       <ExportButton />
 *       {isInternal && <EditButton />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useHasRole(requiredRole: UserRole | UserRole[]): boolean {
  const currentRole = useUserRole();
  return hasRequiredRole(currentRole, requiredRole);
}

/**
 * Utility: Wrap page component with auth guard
 * Use in page.tsx files to protect entire routes
 * 
 * @example
 * ```tsx
 * // In src/app/renuv/internal/page.tsx
 * export default withAuthGuard(InternalDashboard, 'internal');
 * ```
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: UserRole | UserRole[],
  fallback?: ReactNode
) {
  return function GuardedComponent(props: P) {
    return (
      <AuthGuard requiredRole={requiredRole} fallback={fallback}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}
