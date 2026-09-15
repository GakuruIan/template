import { api } from "@/lib/axios"
import { getErrorMessage } from "@/lib/utils"
import { PermissionListItem } from "@/types/types"

export const listPermissions = async () => {
  try {
    const res = await api.get<PermissionListItem[]>("/permissions")

    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}
