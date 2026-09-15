import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import {
  createRole,
  updateRole,
  deleteRole,
  restoreRole,
  syncRolePermissions,
} from "@/services/roles"

export const useCreateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRole,
    mutationKey: queryKeys.roles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles })
    },
  })
}

export const useUpdateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateRole,
    mutationKey: queryKeys.roles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles })
    },
  })
}

export const useDeleteRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteRole,
    mutationKey: queryKeys.roles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles })
    },
  })
}

export const useRestoreRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: restoreRole,
    mutationKey: queryKeys.roles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles })
    },
  })
}

export const useSyncRolePermissions = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: syncRolePermissions,
    mutationKey: queryKeys.roles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles })
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions })
    },
  })
}
