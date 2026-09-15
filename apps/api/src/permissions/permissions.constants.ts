export const PERMISSIONS_KEY = 'permissions';

export const PLATFORM_ADMIN_ROLE = 'Platform Admin';
export const OWNER_ROLE = 'Owner';

export const DEFAULT_PERMISSIONS = [
  { key: 'dashboard:view', description: 'View dashboard' },
  { key: 'users:view', description: 'View users' },
  { key: 'users:create', description: 'Create users' },
  { key: 'users:update', description: 'Update users' },
  { key: 'users:delete', description: 'Delete users' },
  { key: 'permissions:view', description: 'View permissions' },
  { key: 'permissions:create', description: 'Create permissions' },
  { key: 'permissions:delete', description: 'Delete permissions' },
  { key: 'roles:view', description: 'View roles' },
  { key: 'roles:create', description: 'Create roles' },
  { key: 'roles:update', description: 'Update roles' },
  { key: 'roles:delete', description: 'Delete roles' },
  { key: 'roles:restore', description: 'Restore roles' },
  { key: 'invitations:view', description: 'View invitations' },
  { key: 'invitations:accept', description: 'Accept invitations' },
  { key: 'invitations:revoke', description: 'Revoke invitations' },
  { key: 'auditlogs:view', description: 'View audit logs' },
] as const;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  [PLATFORM_ADMIN_ROLE]: DEFAULT_PERMISSIONS.map(
    (permission) => permission.key,
  ),
  [OWNER_ROLE]: DEFAULT_PERMISSIONS.filter((permission) =>
    permission.key.startsWith('roles:'),
  ).map((permission) => permission.key),
};

export function isValidPermissionKey(permission: string) {
  return /^[a-z][a-z0-9_]*:([a-z][a-z0-9_]*|\*)$/.test(permission);
}

export function hasPermission(
  userPermissions: readonly string[] | undefined,
  requiredPermission: string,
) {
  if (!userPermissions) {
    return false;
  }

  const [resource] = requiredPermission.split(':');

  return userPermissions.some(
    (permission) =>
      permission === requiredPermission || permission === `${resource}:*`,
  );
}
