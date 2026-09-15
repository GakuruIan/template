"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { CalendarClock, Eye, Mail, MoreVertical, Ban } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Badge } from "@workspace/ui/components/badge"
import { formatDate } from "@/lib/utils"
import { type InvitationListItem } from "@/services/invitations"

export type InvitationRow = InvitationListItem
export type InvitationAction = Pick<InvitationRow, "id" | "email" | "status">

type InvitationColumnActions = {
  onViewInvitation: (invitation: InvitationRow) => void
  onRevokeInvitation: (invitation: InvitationAction) => void
}

function InvitationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return (
        <Badge className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
          Pending
        </Badge>
      )
    case "ACCEPTED":
      return (
        <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
          Accepted
        </Badge>
      )
    case "REVOKED":
      return <Badge variant="destructive">Revoked</Badge>
    case "EXPIRED":
      return (
        <Badge className="bg-muted text-muted-foreground">Expired</Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export const getColumns = ({
  onViewInvitation,
  onRevokeInvitation,
}: InvitationColumnActions): ColumnDef<InvitationRow>[] => [
  {
    id: "select",
    size: 48,
    minSize: 40,
    maxSize: 56,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: "Invitee",
    cell: ({ getValue, row }) => (
      <button
        type="button"
        className="flex min-w-0 items-center gap-2 text-left hover:underline"
        onClick={() => onViewInvitation(row.original)}
      >
        <Mail className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{getValue<string>()}</span>
      </button>
    ),
  },
  {
    accessorFn: (row) => row.role?.name ?? "--",
    header: "Role",
    size: 140,
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorFn: (row) => row.branch?.name ?? "--",
    header: "Branch",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 120,
    cell: ({ getValue }) => (
      <InvitationStatusBadge status={getValue<string>()} />
    ),
  },
  {
    accessorKey: "expiredAt",
    header: "Expires",
    size: 130,
    cell: ({ getValue }) => (
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <CalendarClock className="size-3.5" />
        {formatDate(getValue<string>())}
      </span>
    ),
  },
  {
    accessorFn: (row) => row.invitedBy?.name ?? "--",
    header: "Invited By",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    size: 120,
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(getValue<string>())}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    size: 90,
    cell: ({ row }) => {
      const invitation = row.original

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
              onSelect={() => onViewInvitation(invitation)}
            >
              <Eye />
              <span className="font-sans text-foreground">View</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              disabled={invitation.status !== "PENDING"}
              onSelect={() => onRevokeInvitation(invitation)}
            >
              <Ban />
              <span className="font-sans">Revoke</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
