import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query-keys"
import {
  listUserOptions,
  type UserOption,
  type UserOptionParams,
} from "@/services/users"

export const useFetchUserOptions = (
  params: UserOptionParams = {},
  options: { enabled?: boolean } = {}
) => {
  return useQuery<UserOption[]>({
    queryKey: [...queryKeys.userOptions, params],
    queryFn: () => listUserOptions(params),
    enabled: options.enabled ?? true,
  })
}
