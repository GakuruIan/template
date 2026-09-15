import { useInfiniteQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query-keys"
import {
  listUsers,
  type UserListParams,
  type UserListResponse,
} from "@/services/users"

export const useFetchUsers = (
  params: Omit<UserListParams, "cursorId"> = {}
) => {
  return useInfiniteQuery<UserListResponse>({
    queryKey: [...queryKeys.users, params],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      listUsers({
        ...params,
        cursorId: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor?.id,
  })
}
