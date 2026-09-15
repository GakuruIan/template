import { api } from "@/lib/axios"
import { getErrorMessage } from "@/lib/utils"

export type DashboardPurchaseOrder = {
  poNumber: string
  supplier: {
    id: string
    name: string
  } | null
  _count: {
    items: number
  }
  status: string
  expectedDate: string | null
}

export type DashboardStats = {
  userCount: number
  pendingPurchaseOrderCount: number
  recentPurchaseOrders: DashboardPurchaseOrder[]
}

export const fetchDashboardStats = async (
  branchId: string
): Promise<DashboardStats> => {
  try {
    const res = await api.get(`/dashboard/${branchId}`)

    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}
