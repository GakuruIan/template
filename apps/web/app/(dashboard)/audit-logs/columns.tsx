"use client"

import { type LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy"
import { Eye, MoreVertical } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { type AuditLogListItem } from "@/services/auditLogs"

export type AuditLogRow = AuditLogListItem

type AuditLogColumnActions = {
  onViewLog: (log: AuditLogRow) => void
}

const formatAction = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "--"

  return new Date(value).toLocaleString()
}

const getEntity = (log: AuditLogRow) => log.entityType ?? log.entity ?? "--"

function AuditActionBadge({ action }: { action: string }) {
  const label = formatAction(action)

  switch (action) {
    case "CREATE":
    case "RESTORE":
    case "ASSIGN":
      return (
        <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
          {label}
        </Badge>
      )
    case "DELETE":
    case "UNASSIGN":
    case "REFUND":
      return <Badge variant="destructive">{label}</Badge>
    case "UPDATE":
      return (
        <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {label}
        </Badge>
      )
    case "PAYMENT":
    case "TRANSFER":
      return (
        <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {label}
        </Badge>
      )
    case "EXPORT":
    case "IMPORT":
      return (
        <Badge className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
          {label}
        </Badge>
      )
    default:
      return <Badge variant="outline">{label}</Badge>
  }
}

export const getColumns = ({
  onViewLog,
}: AuditLogColumnActions): ColumnDef<AuditLogRow>[] => [
  {
    accessorKey: "action",
    header: "Action",
    size: 140,
    cell: ({ getValue }) => <AuditActionBadge action={getValue<string>()} />,
  },
  {
    id: "entity",
    accessorFn: getEntity,
    header: "Entity",
    size: 130,
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "entityId",
    header: "Entity ID",
    cell: ({ getValue }) => (
      <span className="block max-w-[220px] truncate text-sm text-muted-foreground">
        {getValue<string | null>() ?? "--"}
      </span>
    ),
  },
  {
    accessorFn: (row) => row.actor?.name ?? "--",
    header: "Actor",
    size: 160,
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    size: 180,
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {formatDateTime(getValue<string>())}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    size: 90,
    cell: ({ row }) => {
      const log = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44 space-y-1.5" align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-x-2 py-1"
              onSelect={() => onViewLog(log)}
            >
              <Eye />
              <span className="font-sans text-foreground">View</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export { formatAction, formatDateTime, getEntity }
