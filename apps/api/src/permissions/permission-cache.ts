import { Status, type PrismaClient } from 'database';

export type AuthorizationContext = {
  role: {
    id: string;
    name: string;
  } | null;
  permissions: string[];
};

const CACHE_TTL_MS = 5 * 60 * 1000;

const permissionCache = new Map<
  string,
  { expiresAt: number; context: AuthorizationContext }
>();

function cacheKey(userId: string, roleId?: string | null) {
  return `${userId}:${roleId ?? 'none'}`;
}

export function clearPermissionCache() {
  permissionCache.clear();
}

export function clearUserPermissionCache(userId: string) {
  for (const key of permissionCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      permissionCache.delete(key);
    }
  }
}

export async function getUserAuthorizationContext(
  prisma: PrismaClient,
  userId: string,
  roleId?: string | null,
): Promise<AuthorizationContext> {
  const key = cacheKey(userId, roleId);
  const cached = permissionCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.context;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roleId: true,
      role: {
        select: {
          id: true,
          name: true,
          status: true,
          deletedAt: true,
          permissions: {
            select: {
              permission: {
                select: {
                  key: true,
                },
              },
            },
          },
        },
      },
      roles: {
        select: {
          id: true,
          name: true,
          status: true,
          deletedAt: true,
          permissions: {
            select: {
              permission: {
                select: {
                  key: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const activePrimaryRole =
    user?.role &&
    user.role.status === Status.ACTIVE &&
    user.role.deletedAt === null
      ? user.role
      : null;
  const activeAssignedRoles =
    user?.roles.filter(
      (role) => role.status === Status.ACTIVE && role.deletedAt === null,
    ) ?? [];
  const activeRole = activePrimaryRole ?? activeAssignedRoles[0] ?? null;
  const permissionKeys = new Set<string>();

  if (activePrimaryRole) {
    for (const { permission } of activePrimaryRole.permissions) {
      permissionKeys.add(permission.key);
    }
  }

  for (const role of activeAssignedRoles) {
    for (const { permission } of role.permissions) {
      permissionKeys.add(permission.key);
    }
  }

  const context: AuthorizationContext = {
    role: activeRole ? { id: activeRole.id, name: activeRole.name } : null,
    permissions: Array.from(permissionKeys),
  };

  permissionCache.set(cacheKey(userId, user?.roleId ?? roleId), {
    expiresAt: Date.now() + CACHE_TTL_MS,
    context,
  });

  return context;
}
