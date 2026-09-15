import type { AppRole } from "@/lib/roles"

export type UserRoleSlug = "admins" | "managers"

export type UserRoleRouteConfig = {
  label: string
  roleName: AppRole
  allowedRoles: AppRole[]
}

export const userRoleRouteConfig: Record<UserRoleSlug, UserRoleRouteConfig> = {
  admins: {
    label: "Admins",
    roleName: "Platform Admin",
    allowedRoles: ["Platform Admin"],
  },
  managers: {
    label: "Managers",
    roleName: "Manager",
    allowedRoles: ["Platform Admin", "Owner"],
  },
}

export const allUsersAllowedRoles: AppRole[] = ["Platform Admin", "Owner"]

const roleAllowedRoles: Record<AppRole, AppRole[]> = {
  "Platform Admin": ["Platform Admin"],
  Owner: ["Platform Admin", "Owner"],
  Manager: ["Platform Admin", "Owner"],
}

export function getUserRoleRouteConfig(role: string) {
  return userRoleRouteConfig[role as UserRoleSlug]
}

export function canViewUsersRoute(
  currentRole: AppRole | null,
  roleName?: AppRole
) {
  if (!currentRole) return false

  if (!roleName) {
    return allUsersAllowedRoles.includes(currentRole)
  }

  return roleAllowedRoles[roleName].includes(currentRole)
}
