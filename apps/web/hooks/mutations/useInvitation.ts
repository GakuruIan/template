import { useMutation } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { acceptInvitation, revokeInvitation } from "@/services/invitations"
import { useQueryClient } from "@tanstack/react-query"

export const useAcceptInvitationMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: acceptInvitation,
    mutationKey: queryKeys.invitations.accept,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.list })
    },
  })
}

export const useRevokeInvitationMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: revokeInvitation,
    mutationKey: queryKeys.invitations.revoke,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.list })
    },
  })
}
