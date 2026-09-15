import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { getRoleBySlug, listRoles } from "@/services/roles"
import {
  QueryParams,
  RoleListResponse,
  RoleWithPermissions,
} from "@/types/types"

export const useFetchRole = (
  params: Omit<QueryParams, "cursorId"> = {},
  options: { enabled?: boolean } = {}
) => {
  return useInfiniteQuery<RoleListResponse>({
    queryKey: [...queryKeys.roles, params],
    enabled: options.enabled ?? true,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      listRoles({ ...params, cursorId: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor?.id,
  })
}

export const useFetchRoleBySlug = (
  slug?: string,
  options: { enabled?: boolean } = {}
) => {
  return useQuery<RoleWithPermissions>({
    queryKey: [...queryKeys.roles, "slug", slug],
    enabled: Boolean(slug) && (options.enabled ?? true),
    queryFn: () => getRoleBySlug(slug as string),
  })
}
