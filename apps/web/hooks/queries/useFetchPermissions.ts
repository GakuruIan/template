import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query-keys"
import { listPermissions } from "@/services/permissions"
import { PermissionListItem } from "@/types/types"

export const useFetchPermissions = (options: { enabled?: boolean } = {}) => {
  return useQuery<PermissionListItem[]>({
    queryKey: queryKeys.permissions,
    enabled: options.enabled ?? true,
    queryFn: listPermissions,
  })
}
