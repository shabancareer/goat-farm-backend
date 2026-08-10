import { Role, Permission } from './role.enum';

// ─────────────────────────────────────────────────────────────────────────────
// Each role's full permission set
// ─────────────────────────────────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {

    [Role.SUPER_OWNER]: Object.values(Permission), // every permission

    [Role.OWNER]: [
        Permission.CREATE_USER,
        Permission.READ_USER,
        Permission.UPDATE_USER,
        Permission.DELETE_USER,
        Permission.ASSIGN_ROLE,
        Permission.REVOKE_ROLE,
        Permission.MANAGE_ORG,
        Permission.VIEW_ORG,
        Permission.CREATE_RESOURCE,
        Permission.READ_RESOURCE,
        Permission.UPDATE_RESOURCE,
        Permission.DELETE_RESOURCE,
        Permission.VIEW_REPORTS,
        Permission.EXPORT_REPORTS,
        Permission.VIEW_BILLING,
        Permission.MANAGE_SETTINGS,
        Permission.VIEW_SETTINGS,
    ],

    [Role.MANAGER]: [
        Permission.CREATE_USER,
        Permission.READ_USER,
        Permission.UPDATE_USER,
        Permission.VIEW_ORG,
        Permission.CREATE_RESOURCE,
        Permission.READ_RESOURCE,
        Permission.UPDATE_RESOURCE,
        Permission.DELETE_RESOURCE,
        Permission.VIEW_REPORTS,
        Permission.EXPORT_REPORTS,
        Permission.VIEW_SETTINGS,
    ],

    [Role.WORKER]: [
        Permission.READ_USER,
        Permission.VIEW_ORG,
        Permission.CREATE_RESOURCE,
        Permission.READ_RESOURCE,
        Permission.UPDATE_RESOURCE,
        Permission.VIEW_REPORTS,
    ],

    [Role.VIEWER]: [
        Permission.READ_USER,
        Permission.VIEW_ORG,
        Permission.READ_RESOURCE,
        Permission.VIEW_REPORTS,
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Numeric hierarchy — higher = more privileged
// ─────────────────────────────────────────────────────────────────────────────
export const ROLE_HIERARCHY: Record<Role, number> = {
    [Role.SUPER_OWNER]: 100,
    [Role.OWNER]: 80,
    [Role.MANAGER]: 60,
    [Role.WORKER]: 40,
    [Role.VIEWER]: 20,
};

/**
 * Returns true only if the actor's role level is strictly greater than the
 * target's. Equal rank → false (a Manager cannot manage another Manager).
 */
export function canManageRole(actorRole: Role, targetRole: Role): boolean {
    return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Returns true if actorRole's level meets or exceeds minimumRole's level.
 * Used by RolesGuard for route access.
 */
export function meetsMinimumRole(actorRole: Role, minimumRole: Role): boolean {
    return ROLE_HIERARCHY[actorRole] >= ROLE_HIERARCHY[minimumRole];
}