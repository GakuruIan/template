import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query-keys"
import { getInvitation, listInvitations } from "@/services/invitations"

export const useFetchInvitation = (token: string | null) => {
  return useQuery({
    queryKey: queryKeys.invitations.verify(token),
    queryFn: () => {
      if (!token) {
        throw new Error("No invitation token found.")
      }

      return getInvitation(token)
    },
    enabled: Boolean(token),
    retry: false,
    networkMode: "online",
  })
}

export const useFetchInvitations = () => {
  return useQuery({
    queryKey: queryKeys.invitations.list,
    queryFn: listInvitations,
    retry: 5,
    networkMode: "online",
  })
}
