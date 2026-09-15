import { api } from "@/lib/axios"
import { getErrorMessage } from "@/lib/utils"

export type LogsParams = {
  cursorId?: string
  limit?: number
}

export type AuditLogActor = {
  id: string
  name: string | null
}

export type AuditLogListItem = {
  id: string
  action: string
  entity?: string
  entityType?: string
  entityId?: string | null
  actor?: AuditLogActor | null
  createdAt: string
  oldValue?: unknown
  newValue?: unknown
}

export type AuditLogListResponse = {
  logs: AuditLogListItem[]
  nextCursor?: {
    id: string
  }
}

export const fetchLogs = async (params: LogsParams = {}) => {
  try {
    const res = await api.get<AuditLogListResponse>("/auditlogs/list", {
      params,
    })
    if (res.status !== 200) {
      throw new Error("Failed to fetch audit logs")
    }

    return res.data
  } catch (err) {
    throw new Error(getErrorMessage(err))
  }
}
