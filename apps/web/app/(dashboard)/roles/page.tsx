"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { KeyRound, Plus, RotateCcw, ShieldCheck, Trash2, X } from "lucide-react"
import { z } from "zod"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"

import { SummaryItem } from "@/components/drawer-details"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/axios"
import {
  useCreateRole,
  useDeleteRole,
  useRestoreRole,
  useUpdateRole,
} from "@/hooks/mutations/useRole"
import { useFetchRole } from "@/hooks/queries/useFetchRole"
import { type PermissionUser, usePermissions } from "@/hooks/use-permissions"
import { BooleanBadge, DeletedBadge, StatusBadge } from "@/lib/status-badges"
import { formatDate } from "@/lib/utils"
import { DataTable } from "./data-table"
import { getColumns, type EditRole, type RoleRow } from "./columns"

const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(4, "Role name must be at least 4 characters")
    .max(100, "Role name must be 100 characters or less"),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]),
})

type RoleValues = z.infer<typeof roleSchema>
type RoleAction = Pick<RoleRow, "id" | "name">
type AuthSessionResponse = {
  user: PermissionUser
}

const defaultRoleValues: RoleValues = {
  name: "",
  status: "ACTIVE",
}

function RoleDrawerSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t py-5">
      <h3 className="mb-4 text-xs font-semibold">{title}</h3>
      <div className="space-y-3.5">{children}</div>
    </section>
  )
}

function RoleDetailRow({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div className="grid gap-1 text-xs sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words whitespace-pre-line text-foreground">
        {value || "--"}
      </span>
    </div>
  )
}

const Page = () => {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [authzUser, setAuthzUser] = useState<PermissionUser | null>(null)
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true)
  const sessionUser = authzUser ?? (session?.user as PermissionUser | undefined)
  const { can } = usePermissions(sessionUser)
  const canViewRole = can("roles:view")

  const createRoleMutation = useCreateRole()
  const updateRoleMutation = useUpdateRole()
  const deleteRoleMutation = useDeleteRole()
  const restoreRoleMutation = useRestoreRole()
  const rolesQuery = useFetchRole({ limit: 20 }, { enabled: canViewRole })

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<EditRole | null>(null)
  const [viewingRole, setViewingRole] = useState<RoleRow | null>(null)
  const [deletingRole, setDeletingRole] = useState<RoleAction | null>(null)
  const [restoringRole, setRestoringRole] = useState<RoleAction | null>(null)

  const isEditingRole = Boolean(editingRole)
  const isSavingRole =
    createRoleMutation.isPending || updateRoleMutation.isPending
  const isDeletingRole = deleteRoleMutation.isPending
  const isRestoringRole = restoreRoleMutation.isPending
  const canCreateRole = can("roles:create")
  const canUpdateRole = can("roles:update")
  const canDeleteRole = can("roles:delete")
  const canRestoreRole = can("roles:restore")
  const canManageViewingRole =
    viewingRole &&
    !viewingRole.isSystem &&
    ((!viewingRole.deletedAt && (canUpdateRole || canDeleteRole)) ||
      (Boolean(viewingRole.deletedAt) && canRestoreRole))

  useEffect(() => {
    let cancelled = false

    async function fetchAuthorizationUser() {
      if (isPending) return

      if (!session?.user) {
        setAuthzUser(null)
        setIsCheckingPermissions(false)
        return
      }

      setIsCheckingPermissions(true)

      try {
        const { data } = await api.get<AuthSessionResponse>("/auth/session")
        if (!cancelled) {
          setAuthzUser(data.user)
        }
      } catch {
        if (!cancelled) {
          setAuthzUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsCheckingPermissions(false)
        }
      }
    }

    void fetchAuthorizationUser()

    return () => {
      cancelled = true
    }
  }, [isPending, session])

  useEffect(() => {
    if (isPending || isCheckingPermissions || canViewRole) return

    router.replace("/dashboard")
  }, [canViewRole, isCheckingPermissions, isPending, router])

  const roles = useMemo(
    () =>
      rolesQuery.data?.pages.flatMap((page) => page.roles) ?? ([] as RoleRow[]),
    [rolesQuery.data]
  )

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: defaultRoleValues,
  })

  const openCreateDialog = () => {
    setEditingRole(null)
    reset(defaultRoleValues)
    setIsRoleDialogOpen(true)
  }

  const openEditDialog = useCallback(
    (role: EditRole) => {
      setEditingRole(role)
      reset({
        name: role.name,
        status: role.status,
      })
      setIsRoleDialogOpen(true)
    },
    [reset]
  )

  const handleDialogOpenChange = (open: boolean) => {
    setIsRoleDialogOpen(open)
    if (!open) {
      setEditingRole(null)
      reset(defaultRoleValues)
    }
  }

  const handleViewDrawerOpenChange = (open: boolean) => {
    if (!open) setViewingRole(null)
  }

  const onSubmitRole: SubmitHandler<RoleValues> = async (values) => {
    const payload = {
      name: values.name.trim(),
      status: values.status,
    }

    toast.promise(
      isEditingRole && editingRole
        ? updateRoleMutation.mutateAsync({
            id: editingRole.id,
            ...payload,
          })
        : createRoleMutation.mutateAsync(payload),
      {
        loading: isEditingRole ? "Updating role..." : "Creating role...",
        success: () => {
          setIsRoleDialogOpen(false)
          setEditingRole(null)
          reset(defaultRoleValues)
          return isEditingRole
            ? "Role updated successfully"
            : "Role created successfully"
        },
        error: (err) =>
          err instanceof Error ? err.message : "Failed to save role",
        position: "top-right",
      }
    )
  }

  const handleDeleteRole = () => {
    if (!deletingRole) return

    toast.promise(deleteRoleMutation.mutateAsync(deletingRole.id), {
      loading: "Deleting role...",
      success: () => {
        setDeletingRole(null)
        if (viewingRole?.id === deletingRole.id) {
          setViewingRole(null)
        }
        return "Role deleted successfully"
      },
      error: (err) =>
        err instanceof Error ? err.message : "Failed to delete role",
      position: "top-right",
    })
  }

  const handleRestoreRole = () => {
    if (!restoringRole) return

    toast.promise(restoreRoleMutation.mutateAsync(restoringRole.id), {
      loading: "Restoring role...",
      success: () => {
        setRestoringRole(null)
        return "Role restored successfully"
      },
      error: (err) =>
        err instanceof Error ? err.message : "Failed to restore role",
      position: "top-right",
    })
  }

  const handleManagePermissions = useCallback(
    (role: RoleRow) => {
      if (!role.slug) {
        toast.error("This role does not have a permissions URL.")
        return
      }

      router.push(`/roles/${role.slug}/permissions`)
    },
    [router]
  )

  const columns = useMemo(
    () =>
      getColumns({
        canUpdateRole,
        canDeleteRole,
        canRestoreRole,
        onViewRole: setViewingRole,
        onEditRole: openEditDialog,
        onManagePermissions: handleManagePermissions,
        onDeleteRole: setDeletingRole,
        onRestoreRole: setRestoringRole,
      }),
    [
      canDeleteRole,
      canRestoreRole,
      canUpdateRole,
      handleManagePermissions,
      openEditDialog,
    ]
  )

  if (isPending || isCheckingPermissions || !canViewRole) return null

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="text-lg font-medium tracking-wide">
            Roles & Permissions
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage role access and lifecycle.
          </p>
        </div>

        {canCreateRole ? (
          <Button
            type="button"
            className="flex items-center gap-x-2 sm:ml-auto"
            onClick={openCreateDialog}
          >
            <Plus /> Add Role
          </Button>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        data={roles}
        isLoading={rolesQuery.isLoading}
        isFetching={rolesQuery.isFetchingNextPage}
        hasNextPage={rolesQuery.hasNextPage}
        onNextPage={() => rolesQuery.fetchNextPage()}
        loadingText="Loading roles..."
        emptyIcon={<ShieldCheck className="size-4" />}
        emptyTitle="No roles yet"
        emptyDescription="Roles will appear here once they are added."
        searchPlaceholder="Search roles..."
        searchButtonText="Search"
        hasError={rolesQuery.isError}
        errorMessage={
          rolesQuery.error instanceof Error
            ? rolesQuery.error.message
            : "Failed to load roles."
        }
        getRowId={(role) => role.id}
      />

      <Dialog open={isRoleDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditingRole ? "Edit role" : "Create role"}
            </DialogTitle>
            <DialogDescription>
              {isEditingRole
                ? "Update this custom role."
                : "Add a new custom role."}
            </DialogDescription>
          </DialogHeader>

          <form
            id="role-form"
            className="space-y-5"
            onSubmit={handleSubmit(onSubmitRole)}
          >
            <FieldGroup>
              <Field data-invalid={Boolean(errors.name)}>
                <FieldLabel htmlFor="role-name">Name</FieldLabel>
                <Input
                  id="role-name"
                  placeholder="Inventory Manager"
                  aria-invalid={Boolean(errors.name)}
                  disabled={isSavingRole}
                  {...register("name")}
                />
                <FieldError errors={[errors.name]} />
              </Field>

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.status)}>
                    <FieldLabel>Status</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSavingRole}
                    >
                      <SelectTrigger aria-invalid={Boolean(errors.status)}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[errors.status]} />
                  </Field>
                )}
              />
            </FieldGroup>
          </form>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSavingRole}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" form="role-form" disabled={isSavingRole}>
              {isSavingRole ? (
                <div className="flex items-center gap-x-1">
                  <Spinner className="size-3" />
                  <span>Saving...</span>
                </div>
              ) : (
                "Save role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Drawer
        open={Boolean(viewingRole)}
        onOpenChange={handleViewDrawerOpenChange}
        direction="right"
      >
        <DrawerContent className="data-[drawer-direction=right]:sm:max-w-lg">
          <DrawerHeader className="relative border-b px-6 py-3">
            <DrawerTitle className="pr-8 text-sm">
              {viewingRole?.name ?? "Role details"}
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              {viewingRole?.slug ?? "View role information"}
            </DrawerDescription>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute top-3 right-3 text-muted-foreground"
              >
                <X />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </DrawerHeader>

          {viewingRole ? (
            <div className="overflow-y-auto px-6 pb-24">
              <div className="flex items-center gap-5 border-b py-5">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-md border border-input bg-muted">
                  <KeyRound className="size-7 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl font-medium">
                    {viewingRole.name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {viewingRole.slug ?? "--"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5 py-5">
                <SummaryItem label="Status">
                  <StatusBadge status={viewingRole.status} />
                </SummaryItem>
                <SummaryItem label="Type">
                  <BooleanBadge
                    value={viewingRole.isSystem}
                    trueLabel="System"
                    falseLabel="Custom"
                  />
                </SummaryItem>
                <SummaryItem label="Deleted">
                  <DeletedBadge isDeleted={Boolean(viewingRole.deletedAt)} />
                </SummaryItem>
              </div>

              <RoleDrawerSection title="Role">
                <RoleDetailRow label="Name:" value={viewingRole.name} />
                <RoleDetailRow label="Slug:" value={viewingRole.slug} />
                <RoleDetailRow label="Status:" value={viewingRole.status} />
                <RoleDetailRow
                  label="Type:"
                  value={viewingRole.isSystem ? "System" : "Custom"}
                />
              </RoleDrawerSection>

              <RoleDrawerSection title="People">
                <RoleDetailRow
                  label="Creator:"
                  value={viewingRole.creator?.name}
                />
                <RoleDetailRow
                  label="Deleted by:"
                  value={viewingRole.deletedBy?.name}
                />
              </RoleDrawerSection>

              <RoleDrawerSection title="Lifecycle">
                <RoleDetailRow
                  label="Created at:"
                  value={formatDate(viewingRole.createdAt)}
                />
                <RoleDetailRow
                  label="Deleted at:"
                  value={formatDate(viewingRole.deletedAt)}
                />
              </RoleDrawerSection>
            </div>
          ) : null}

          {canManageViewingRole ? (
            <div className="absolute right-0 bottom-0 left-0 grid grid-cols-2 gap-2 border-t bg-popover p-4">
              {!viewingRole.deletedAt && canUpdateRole ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setViewingRole(null)
                    openEditDialog(viewingRole)
                  }}
                >
                  Edit
                </Button>
              ) : (
                <div />
              )}

              {viewingRole.deletedAt && canRestoreRole ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setViewingRole(null)
                    setRestoringRole(viewingRole)
                  }}
                >
                  Restore
                </Button>
              ) : !viewingRole.deletedAt && canDeleteRole ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setViewingRole(null)
                    setDeletingRole(viewingRole)
                  }}
                >
                  Delete
                </Button>
              ) : (
                <div />
              )}
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={Boolean(deletingRole)}
        onOpenChange={(open) => {
          if (!open) setDeletingRole(null)
        }}
      >
        <AlertDialogContent className="max-w-3xl" size="default">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this role?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This will mark ${deletingRole?.name ?? "this role"} as deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingRole}>
              No, cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteRole}
              disabled={isDeletingRole}
            >
              {isDeletingRole ? (
                <div className="flex items-center gap-x-1">
                  <Spinner className="size-3" />
                  <span>Deleting...</span>
                </div>
              ) : (
                "Yes, delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(restoringRole)}
        onOpenChange={(open) => {
          if (!open) setRestoringRole(null)
        }}
      >
        <AlertDialogContent className="max-w-3xl" size="default">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-green-500/10 text-green-500 dark:bg-green-500/20 dark:text-green-500">
              <RotateCcw />
            </AlertDialogMedia>
            <AlertDialogTitle>Restore this role?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This will restore ${restoringRole?.name ?? "this role"} and show it in role listings again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoringRole}>
              No, cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreRole}
              disabled={isRestoringRole}
            >
              {isRestoringRole ? (
                <div className="flex items-center gap-x-1">
                  <Spinner className="size-3" />
                  <span>Restoring...</span>
                </div>
              ) : (
                "Yes, restore"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Page
