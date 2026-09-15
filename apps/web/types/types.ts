import type { Status } from "database"

export type QueryParams = {
  cursorId?: string
  limit?: number
}

export type CreateRole = {
  name: string
  status?: Status
}

export type UpdateRole = Partial<CreateRole> & {
  id: string
}

export type RoleUser = {
  id: string
  name: string | null
}

export type RoleListItem = {
  id: string
  name: string
  slug: string | null
  isSystem: boolean
  status: Status
  creator?: RoleUser | null
  createdAt: string | Date
  deletedAt: string | Date | null
  deletedBy?: RoleUser | null
}

export type RoleListResponse = {
  roles: RoleListItem[]
  nextCursor?: {
    id: string
  } | null
}

export type PermissionListItem = {
  id: string
  key: string
  description: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

export type RolePermissionItem = {
  permission: Pick<PermissionListItem, "id" | "key" | "description">
}

export type RoleWithPermissions = Pick<
  RoleListItem,
  "id" | "name" | "slug" | "isSystem" | "status" | "createdAt" | "deletedAt"
> & {
  permissions: RolePermissionItem[]
}

export type SyncRolePermissions = {
  roleId: string
  permissionIds: string[]
}
