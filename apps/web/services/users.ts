import { api } from "@/lib/axios"
import { type QueryParams } from "@/types/types"

import { getErrorMessage } from "@/lib/utils"

type CreateUser = {
  name: string
  email: string
  phoneNumber?: string
  roleName: string
}

export type UpdateUser = {
  id: string
  name?: string
  email?: string
  phoneNumber?: string
}

type UserRole = {
  name: string
}

export type UserListParams = QueryParams & {
  roleName?: string
  excludeRoleName?: string
}

export type UserListItem = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  phoneNumber: string | null
  employeeCode: string | null
  createdAt: Date | string
  updatedAt: Date | string
  role: UserRole | null
}

export type UserListResponse = {
  users: UserListItem[]
  nextCursor?: {
    id: string
  }
}

export type UserOptionParams = {
  roleName?: string
  search?: string
}

export type UserOption = {
  id: string
  name: string
  email: string
  role: UserRole | null
}

export const createUser = async (data: CreateUser) => {
  try {
    const res = await api.post("/users/create", data)

    if (res.status !== 201) {
      throw new Error(res.data.error || "Failed to create user")
    }

    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const updateUser = async (data: UpdateUser) => {
  try {
    const { id, ...payload } = data
    const res = await api.patch(`/users/${id}`, payload)

    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const listUsers = async (params: UserListParams = {}) => {
  try {
    const res = await api.get<UserListResponse>("/users/list", {
      params,
    })

    return res.data
  } catch (err) {
    throw new Error(getErrorMessage(err))
  }
}

export const listUserOptions = async (params: UserOptionParams = {}) => {
  try {
    const res = await api.get<UserOption[]>("/users/options", {
      params,
    })

    return res.data
  } catch (err) {
    throw new Error(getErrorMessage(err))
  }
}
