"use client"

export type PermissionUser = {
  permissions?: readonly string[] | null
}

export function canAccess(
  user: PermissionUser | null | undefined,
  permission: string
) {
  const permissions = user?.permissions

  if (!permissions) {
    return false
  }

  const [resource] = permission.split(":")

  return permissions.some(
    (userPermission) =>
      userPermission === permission || userPermission === `${resource}:*`
  )
}

export function usePermissions(user: PermissionUser | null | undefined) {
  return {
    can: (permission: string) => canAccess(user, permission),
  }
}
