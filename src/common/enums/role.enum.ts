// ─────────────────────────────────────────────────────────────────────────────
// Roles — ordered from most to least privileged
// ─────────────────────────────────────────────────────────────────────────────
export enum Role {
  SUPER_OWNER = 'super_owner', // Created automatically on software purchase
  OWNER       = 'owner',       // Full org control, added by Super Owner
  MANAGER     = 'manager',     // Manage workers and resources
  WORKER      = 'worker',      // Day-to-day operations
  VIEWER      = 'viewer',      // Read-only
}

// ─────────────────────────────────────────────────────────────────────────────
// Permissions — granular actions each role can perform
// ─────────────────────────────────────────────────────────────────────────────
export enum Permission {
  // User management
  CREATE_USER   = 'create_user',
  READ_USER     = 'read_user',
  UPDATE_USER   = 'update_user',
  DELETE_USER   = 'delete_user',

  // Role management
  ASSIGN_ROLE   = 'assign_role',
  REVOKE_ROLE   = 'revoke_role',

  // Organization
  MANAGE_ORG    = 'manage_org',
  VIEW_ORG      = 'view_org',

  // Resources
  CREATE_RESOURCE = 'create_resource',
  READ_RESOURCE   = 'read_resource',
  UPDATE_RESOURCE = 'update_resource',
  DELETE_RESOURCE = 'delete_resource',

  // Reports & billing
  VIEW_REPORTS    = 'view_reports',
  EXPORT_REPORTS  = 'export_reports',
  MANAGE_BILLING  = 'manage_billing',
  VIEW_BILLING    = 'view_billing',

  // Settings
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_SETTINGS   = 'view_settings',
}