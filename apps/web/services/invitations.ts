import { api } from "@/lib/axios"
import { getErrorMessage } from "@/lib/utils"

export type InvitationVerification = {
  email: string
  expiredAt: string
  role: {
    name: string
  }
  revokedAt: string | null
  used: boolean
  status: string
}

export type InvitationListItem = {
  id: string
  email: string
  status: string
  branch: {
    id: string
    name: string
  } | null
  role: {
    name: string
  } | null
  expiredAt: string
  invitedBy: {
    id: string
    name: string | null
  } | null
  revokedAt: string | null
  revokedBy: {
    id: string
    name: string | null
  } | null
  used: boolean
  usedAt: string | null
  createdAt: string
}

export type InvitationStatusCounts = {
  PENDING: number
  ACCEPTED: number
  EXPIRED: number
  REVOKED: number
}

export type InvitationListResponse = {
  invitations: InvitationListItem[]
  counts: InvitationStatusCounts
}

export const getInvitation = async (token: string) => {
  try {
    const res = await api.get<InvitationVerification>("/invitations/verify", {
      params: {
        token,
      },
    })

    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const listInvitations = async () => {
  try {
    const res = await api.get<InvitationListResponse>("/invitations/list")
    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const acceptInvitation = async (data: {
  token: string
  password?: string
  pin?: string
}) => {
  try {
    const res = await api.post("/invitations/accept-invitation", data)

    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const revokeInvitation = async (invitationId: string) => {
  try {
    const res = await api.post(`/invitations/revoke/${invitationId}`)

    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}
