import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { fetchDashboardStats } from "@/services/dashboard"

export const useFetchDashboardStat = (branchId: string) => {
  return useQuery({
    queryKey: [...queryKeys.dashboard, branchId],
    queryFn: () => fetchDashboardStats(branchId),
    enabled: !!branchId,
  })
}
