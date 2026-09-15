export type AppRole = "Platform Admin" | "Owner" | "Manager"

export type SessionRole = string | { name?: string | null } | null | undefined

export function normalizeRole(role: SessionRole): AppRole | null {
  const roleName = typeof role === "string" ? role : role?.name

  switch (roleName) {
    case "Platform Admin":
    case "platform admin":
    case "platform-admin":
    case "platform_admin":
    case "PLATFORM_ADMIN":
      return "Platform Admin"
    case "Owner":
    case "owner":
    case "OWNER":
      return "Owner"
    case "Manager":
    case "manager":
    case "MANAGER":
    case "ADMIN":
      return "Manager"
    default:
      return null
  }
}

export function roleRedirect(role: SessionRole) {
  const normalizedRole = normalizeRole(role)

  if (!normalizedRole) {
    return "/login"
  }

  return "/dashboard"
}
