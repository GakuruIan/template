"use client"

import { type LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy"
import {
  Eye,
  KeyRound,
  MoreVertical,
  RotateCcw,
  ShieldCheck,
  SquarePen,
  Trash2,
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
import { BooleanBadge, DeletedBadge, StatusBadge } from "@/lib/status-badges"
import { type RoleListItem } from "@/types/types"

export type RoleRow = RoleListItem
type RoleAction = Pick<RoleRow, "id" | "name">
export type EditRole = Pick<RoleRow, "id" | "name" | "status">

type RoleColumnActions = {
  canUpdateRole: boolean
  canDeleteRole: boolean
  canRestoreRole: boolean
  onViewRole: (role: RoleRow) => void
  onEditRole: (role: EditRole) => void
  onManagePermissions: (role: RoleRow) => void
  onDeleteRole: (role: RoleAction) => void
  onRestoreRole: (role: RoleAction) => void
}

const formatDate = (value?: string | Date | null) => {
  if (!value) return "--"

  return new Date(value).toLocaleDateString()
}

export const getColumns = ({
  canUpdateRole,
  canDeleteRole,
  canRestoreRole,
  onViewRole,
  onEditRole,
  onManagePermissions,
  onDeleteRole,
  onRestoreRole,
}: RoleColumnActions): ColumnDef<RoleRow>[] => [
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
    header: "Role",
    cell: ({ getValue, row }) => (
      <button
        type="button"
        className="flex min-w-0 items-center gap-2 text-left hover:underline"
        onClick={() => onViewRole(row.original)}
      >
        <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{getValue<string>()}</span>
          <span className="truncate text-xs text-muted-foreground">
            {row.original.slug ?? "--"}
          </span>
        </span>
      </button>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 120,
    cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
  },
  {
    accessorKey: "isSystem",
    header: "Type",
    size: 130,
    cell: ({ getValue }) => (
      <BooleanBadge
        value={getValue<boolean>()}
        trueLabel="System"
        falseLabel="Custom"
      />
    ),
  },
  {
    id: "deleted",
    header: "Deleted",
    size: 120,
    accessorFn: (row) => Boolean(row.deletedAt),
    cell: ({ getValue }) => <DeletedBadge isDeleted={getValue<boolean>()} />,
  },
  {
    accessorFn: (row) => row.creator?.name ?? "--",
    header: "Creator",
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
        {formatDate(getValue<string | Date>())}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    size: 90,
    cell: ({ row }) => {
      const role = row.original
      const isDeleted = Boolean(role.deletedAt)
      const canManageActiveRole = !isDeleted && (canUpdateRole || canDeleteRole)
      const canManageDeletedRole = isDeleted && canRestoreRole

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 space-y-1.5" align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="flex items-center gap-x-2 py-1"
              onSelect={() => onViewRole(role)}
            >
              <Eye />
              <span className="font-sans text-foreground">View</span>
            </DropdownMenuItem>

            {role.isSystem ? null : (
              <>
                {!isDeleted && canUpdateRole ? (
                  <>
                    <DropdownMenuItem
                      className="flex items-center gap-x-2 py-1"
                      onSelect={() => onEditRole(role)}
                    >
                      <SquarePen />
                      <span className="font-sans text-foreground">Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-x-2 py-1"
                      disabled={!role.slug}
                      onSelect={() => onManagePermissions(role)}
                    >
                      <KeyRound />
                      <span className="font-sans text-foreground">
                        Permissions
                      </span>
                    </DropdownMenuItem>
                  </>
                ) : null}

                {canManageActiveRole || canManageDeletedRole ? (
                  <DropdownMenuSeparator />
                ) : null}

                {isDeleted && canRestoreRole ? (
                  <DropdownMenuItem
                    className="bg-green-400/20 text-green-700 hover:bg-green-400/30 dark:text-green-300"
                    onSelect={() => onRestoreRole(role)}
                  >
                    <RotateCcw />
                    <span className="font-sans">Restore</span>
                  </DropdownMenuItem>
                ) : !isDeleted && canDeleteRole ? (
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => onDeleteRole(role)}
                  >
                    <Trash2 />
                    <span className="font-sans">Delete</span>
                  </DropdownMenuItem>
                ) : null}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
