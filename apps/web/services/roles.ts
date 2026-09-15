import { api } from "@/lib/axios"
import { getErrorMessage } from "@/lib/utils"
import {
  CreateRole,
  QueryParams,
  RoleListResponse,
  RoleWithPermissions,
  SyncRolePermissions,
  UpdateRole,
} from "@/types/types"

export const createRole = async (data: CreateRole) => {
  try {
    const res = await api.post("/roles/create", data)
    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const updateRole = async (data: UpdateRole) => {
  try {
    const { id, ...payload } = data
    const res = await api.patch(`/roles/${id}/update`, payload)
    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const listRoles = async (params: QueryParams = {}) => {
  try {
    const res = await api.get<RoleListResponse>("/roles/list", { params })

    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const getRoleBySlug = async (slug: string) => {
  try {
    const res = await api.get<RoleWithPermissions>(
      `/roles/slug/${encodeURIComponent(slug)}`
    )

    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const syncRolePermissions = async (data: SyncRolePermissions) => {
  try {
    const { roleId, permissionIds } = data
    const res = await api.put(`/roles/${roleId}/permissions`, {
      permissionIds,
    })

    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const deleteRole = async (id: string) => {
  try {
    const res = await api.patch(`/roles/${id}/delete`)

    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const restoreRole = async (id: string) => {
  try {
    const res = await api.patch(`/roles/${id}/restore`)
    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}
