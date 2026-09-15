"use client"

import { Badge } from "@workspace/ui/components/badge"

export type AppStatus = "ACTIVE" | "INACTIVE" | "CLOSED" | "DRAFT" | string

type StatusBadgeConfig = {
  label: string
  className?: string
  isDestructive?: boolean
}

export const getStatusBadgeConfig = (status: AppStatus): StatusBadgeConfig => {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Active",
        className:
          "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
      }

    case "INACTIVE":
      return {
        label: "Inactive",
        className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
      }
    case "CANCELLED":
      return {
        label: "Cancelled",
        className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
      }

    case "CLOSED":
      return {
        label: "Closed",
        className:
          "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
      }
    case "DRAFT":
      return {
        label: "Draft",
        className:
          "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
      }
    case "SENT":
      return {
        label: "Sent",
        className:
          "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
      }
    case "PENDING_APPROVAL":
      return {
        label: "Pending approval",
        className:
          "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
      }
    case "APPROVED":
      return {
        label: "Approved",
        className:
          "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
      }
    case "IN_TRANSIT":
      return {
        label: "In transit",
        className:
          "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
      }
    case "REJECTED":
      return {
        label: "Rejected",
        className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
      }
    case "PARTIALLY_RECEIVED":
      return {
        label: "Partially received",
        className:
          "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      }
    case "RECEIVED":
      return {
        label: "Received",
        className:
          "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
      }
    default:
      return { label: status }
  }
}

export const getDeletedBadgeConfig = (
  isDeleted: boolean
): StatusBadgeConfig => {
  if (isDeleted) {
    return {
      label: "Deleted",
      className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    }
  }

  return {
    label: "Not Deleted",
    className: "bg-muted text-muted-foreground",
  }
}

export const getBooleanBadgeConfig = (
  value: boolean,
  trueLabel: string,
  falseLabel: string
): StatusBadgeConfig => {
  if (value) {
    return {
      label: trueLabel,
      className:
        "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    }
  }

  return {
    label: falseLabel,
    className: "bg-muted text-muted-foreground",
  }
}

export function StatusBadge({ status }: { status: AppStatus }) {
  const config = getStatusBadgeConfig(status)

  if (config.isDestructive) {
    return <Badge variant="destructive">{config.label}</Badge>
  }

  return <Badge className={config.className}>{config.label}</Badge>
}

export function DeletedBadge({ isDeleted }: { isDeleted: boolean }) {
  const config = getDeletedBadgeConfig(isDeleted)

  if (config.isDestructive) {
    return <Badge variant="destructive">{config.label}</Badge>
  }

  return <Badge className={config.className}>{config.label}</Badge>
}

export function BooleanBadge({
  value,
  trueLabel,
  falseLabel,
}: {
  value: boolean
  trueLabel: string
  falseLabel: string
}) {
  const config = getBooleanBadgeConfig(value, trueLabel, falseLabel)

  return <Badge className={config.className}>{config.label}</Badge>
}
