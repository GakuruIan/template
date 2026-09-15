import { useInfiniteQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query-keys"
import {
  fetchLogs,
  type AuditLogListResponse,
  type LogsParams,
} from "@/services/auditLogs"

export const useFetchLogs = (
  params: Omit<LogsParams, "cursorId"> = {},
  options: { enabled?: boolean } = {}
) => {
  return useInfiniteQuery<AuditLogListResponse>({
    queryKey: [...queryKeys.auditLogs, params],
    enabled: options.enabled ?? true,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchLogs({
        ...params,
        cursorId: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor?.id,
    // refetchInterval: 5000,
    refetchOnWindowFocus: true,
  })
}
