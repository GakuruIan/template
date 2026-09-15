"use client"

import { type LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy"
import {
  Eye,
  MoreVertical,
  ShieldCheck,
  SquarePen,
  Trash2,
  UserRound,
} from "lucide-react"

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
import { BooleanBadge } from "@/lib/status-badges"
import { formatDate } from "@/lib/utils"
import { type UserListItem } from "@/services/users"

export type UserRow = UserListItem
export type EditUser = Pick<UserRow, "id" | "name" | "email" | "phoneNumber">
export type UserAction = Pick<
  UserRow,
  "id" | "name" | "email" | "role"
>

type UserColumnActions = {
  canManageUserAccess?: boolean
  onViewUser: (user: UserRow) => void
  onEditUser: (user: EditUser) => void
  onChangeRole: (user: UserAction) => void
  onDeleteUser: (user: UserAction) => void
}

export const getColumns = ({
  canManageUserAccess = true,
  onViewUser,
  onEditUser,
  onChangeRole,
  onDeleteUser,
}: UserColumnActions): ColumnDef<UserRow>[] => [
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
    accessorKey: "name",
    header: "User",
    cell: ({ getValue, row }) => (
      <button
        type="button"
        className="flex min-w-0 items-center gap-2 text-left hover:underline"
        onClick={() => onViewUser(row.original)}
      >
        <UserRound className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{getValue<string>()}</span>
      </button>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {getValue<string>()}
      </span>
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
    accessorKey: "emailVerified",
    header: "Verified",
    size: 120,
    cell: ({ getValue }) => (
      <BooleanBadge
        value={getValue<boolean>()}
        trueLabel="Verified"
        falseLabel="Unverified"
      />
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    size: 120,
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(getValue<Date | string>())}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    size: 90,
    cell: ({ row }) => {
      const user = row.original

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
              onSelect={() => onViewUser(user)}
            >
              <Eye />
              <span className="font-sans text-foreground">View</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-x-2 py-1"
              onSelect={() => onEditUser(user)}
            >
              <SquarePen />
              <span className="font-sans text-foreground">Edit</span>
            </DropdownMenuItem>
            {canManageUserAccess ? (
              <DropdownMenuItem
                className="flex items-center gap-x-2 py-1"
                onSelect={() => onChangeRole(user)}
              >
                <ShieldCheck />
                <span className="font-sans text-foreground">Change Role</span>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onDeleteUser(user)}
            >
              <Trash2 />
              <span className="font-sans">Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
