"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, SquarePen, Trash2, UserRound, X } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
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
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"
import {
  Field,
  FieldDescription,
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
import { DataTable } from "@workspace/ui/components/data-table"
import {
  DetailRow,
  DrawerSection,
  SummaryItem,
} from "@/components/drawer-details"
import {
  useUpdateUserMutation,
  useUserMutation,
} from "@/hooks/mutations/useUser"
import { useFetchUsers } from "@/hooks/queries/useFetchUsers"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/axios"
import { normalizeRole, type AppRole, type SessionRole } from "@/lib/roles"
import { BooleanBadge } from "@/lib/status-badges"
import { formatDate } from "@/lib/utils"
import {
  getColumns,
  type EditUser,
  type UserAction,
  type UserRow,
} from "./columns"
import { canViewUsersRoute } from "./role-config"

const userSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "User name must be at least 2 characters")
    .max(100, "User name must be 100 characters or less"),
  email: z.string().trim().email("Enter a valid email address"),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^[17]\d{8}$/.test(value), {
      message: "Enter a valid phone number, e.g. 712567983",
    }),
  roleName: z
    .enum(["Platform Admin", "Owner", "Manager"])
    .optional()
    .or(z.literal("")),
})

type UserValues = z.infer<typeof userSchema>

const defaultUserValues: UserValues = {
  name: "",
  email: "",
  phoneNumber: "",
  roleName: "",
}

const roleOptions = ["Platform Admin", "Owner", "Manager"] as const

function sanitizePhoneNumber(value: string) {
  return value
    .replace(/^\+?254\s?/, "")
    .replace(/^0/, "")
    .replace(/\D/g, "")
    .slice(0, 9)
}

function formatPhoneNumber(value?: string) {
  if (!value) return undefined

  return `+254 ${value}`
}

type SessionUserWithRole = {
  role?: SessionRole
}

type AuthSessionResponse = {
  user: SessionUserWithRole
}

function getUsersTitle(roleName?: AppRole) {
  if (roleName === "Platform Admin") return "Admins"
  if (roleName === "Manager") return "Managers"

  return "Users"
}

type UsersPageClientProps = {
  roleName?: AppRole
}

export function UsersPageClient({ roleName }: UsersPageClientProps) {
  const router = useRouter()
  const userMutation = useUserMutation()
  const updateUserMutation = useUpdateUserMutation()
  const { data: session, isPending } = authClient.useSession()
  const [authzUser, setAuthzUser] = useState<SessionUserWithRole | null>(null)
  const [isCheckingRole, setIsCheckingRole] = useState(true)
  const currentRole = normalizeRole(authzUser?.role)
  const canViewPage = canViewUsersRoute(currentRole, roleName)
  const usersTitle = getUsersTitle(roleName)
  const usersQuery = useFetchUsers({
    limit: 20,
    roleName,
    excludeRoleName: roleName ? undefined : "Platform Admin",
  })

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isSubmittingUser, setIsSubmittingUser] = useState(false)
  const [viewingUser, setViewingUser] = useState<UserRow | null>(null)
  const [editingUser, setEditingUser] = useState<EditUser | null>(null)
  const [changingRoleUser, setChangingRoleUser] = useState<UserAction | null>(
    null
  )
  const [deletingUser, setDeletingUser] = useState<UserAction | null>(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [isChangingRole, setIsChangingRole] = useState(false)
  const [isDeletingUser, setIsDeletingUser] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchAuthorizationUser() {
      if (isPending) return

      if (!session?.user) {
        setAuthzUser(null)
        setIsCheckingRole(false)
        return
      }

      setIsCheckingRole(true)

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
          setIsCheckingRole(false)
        }
      }
    }

    void fetchAuthorizationUser()

    return () => {
      cancelled = true
    }
  }, [isPending, session])

  useEffect(() => {
    if (isPending || isCheckingRole || canViewPage) return

    router.replace("/dashboard")
  }, [canViewPage, isCheckingRole, isPending, router])

  const isEditingUser = Boolean(editingUser)

  const users = useMemo(
    () => usersQuery.data?.pages.flatMap((page) => page.users) ?? [],
    [usersQuery.data]
  )

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      ...defaultUserValues,
      roleName: roleName ?? "",
    },
  })

  const openCreateDialog = () => {
    setEditingUser(null)
    reset({
      ...defaultUserValues,
      roleName: roleName ?? "",
    })
    setIsUserDialogOpen(true)
  }

  const openEditDialog = useCallback(
    (user: EditUser) => {
      setEditingUser(user)
      reset({
        name: user.name,
        email: user.email,
        phoneNumber: sanitizePhoneNumber(user.phoneNumber ?? ""),
        roleName: roleName ?? "",
      })
      setIsUserDialogOpen(true)
    },
    [reset, roleName]
  )

  const handleUserDialogOpenChange = (open: boolean) => {
    setIsUserDialogOpen(open)

    if (!open) {
      setEditingUser(null)
      reset({
        ...defaultUserValues,
        roleName: roleName ?? "",
      })
    }
  }

  const openChangeRoleDialog = useCallback((user: UserAction) => {
    setChangingRoleUser(user)
    setSelectedRole("")
  }, [])

  const handleViewDrawerOpenChange = (open: boolean) => {
    if (!open) setViewingUser(null)
  }

  const onSubmit: SubmitHandler<UserValues> = async (values) => {
    if (!editingUser && !values.roleName) {
      setError("roleName", {
        type: "manual",
        message: "Select a user role before creating this user.",
      })
      return
    }

    setIsSubmittingUser(true)

    try {
      if (editingUser) {
        const mutation = updateUserMutation.mutateAsync({
          id: editingUser.id,
          name: values.name,
          email: values.email,
          phoneNumber: formatPhoneNumber(values.phoneNumber),
        })

        toast.promise(mutation, {
          loading: "Updating user...",
          success: () => {
            reset(defaultUserValues)
            setEditingUser(null)
            setIsUserDialogOpen(false)
            return "User updated successfully"
          },
          error: (err) =>
            err instanceof Error ? err.message : "Failed to update user",
          finally: () => setIsSubmittingUser(false),
          position: "top-right",
        })
      } else {
        const createRoleName = values.roleName

        if (!createRoleName) {
          setError("roleName", {
            type: "manual",
            message: "Select a user role before creating this user.",
          })
          setIsSubmittingUser(false)
          return
        }

        const mutation = userMutation.mutateAsync({
          name: values.name,
          email: values.email,
          phoneNumber: formatPhoneNumber(values.phoneNumber),
          roleName: createRoleName,
        })

        toast.promise(mutation, {
          loading: "Creating user...",
          success: () => {
            reset(defaultUserValues)
            setIsUserDialogOpen(false)
            return "User created successfully"
          },
          error: (err) =>
            err instanceof Error ? err.message : "Failed to create user",
          finally: () => setIsSubmittingUser(false),
          position: "top-right",
        })
      }
    } catch {
      setIsSubmittingUser(false)
    }
  }

  const handleChangeRole = async () => {
    if (!changingRoleUser || !selectedRole) return

    setIsChangingRole(true)

    try {
      console.log("TODO: change user role", {
        userId: changingRoleUser.id,
        role: selectedRole,
      })
      toast.info("Change role submission template is ready.")
    } finally {
      setIsChangingRole(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    setIsDeletingUser(true)

    try {
      console.log("TODO: delete user", {
        userId: deletingUser.id,
      })
      toast.info("Delete user submission template is ready.")
    } finally {
      setIsDeletingUser(false)
    }
  }

  const columns = useMemo(
    () =>
      getColumns({
        onViewUser: setViewingUser,
        onEditUser: openEditDialog,
        onChangeRole: openChangeRoleDialog,
        onDeleteUser: setDeletingUser,
      }),
    [openChangeRoleDialog, openEditDialog]
  )

  if (isPending || isCheckingRole || !canViewPage) return null

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="text-lg font-medium tracking-wide">{usersTitle}</h2>
          <p className="text-sm text-muted-foreground">
            Manage team access, contact details, and assigned roles.
          </p>
        </div>

        <Dialog
          open={isUserDialogOpen}
          onOpenChange={handleUserDialogOpenChange}
        >
          <Button
            type="button"
            className="flex items-center gap-x-2 sm:ml-auto"
            onClick={openCreateDialog}
          >
            <Plus /> Add User
          </Button>

          <DialogContent className="md:max-w-lg">
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>
                  {isEditingUser ? "Edit User" : "Create User"}
                </DialogTitle>
                <DialogDescription>
                  {isEditingUser
                    ? "Update the basic user details."
                    : "Create a user record without creating an account."}
                </DialogDescription>
              </DialogHeader>

              <FieldGroup>
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="user-name">Full name</FieldLabel>
                  <Input
                    id="user-name"
                    placeholder="e.g Jane Doe"
                    aria-invalid={!!errors.name}
                    {...register("name")}
                  />
                  <FieldError errors={[errors.name]} />
                </Field>

                <Field data-invalid={!!errors.email}>
                  <FieldLabel htmlFor="user-email">Email</FieldLabel>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="jane@example.com"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  <FieldError errors={[errors.email]} />
                </Field>

                {!isEditingUser ? (
                  <>
                    <Controller
                      name="roleName"
                      control={control}
                      render={({ field }) => (
                        <Field data-invalid={Boolean(errors.roleName)}>
                          <FieldLabel>Role</FieldLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={Boolean(roleName)}
                          >
                            <SelectTrigger
                              aria-invalid={Boolean(errors.roleName)}
                            >
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              {roleOptions.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldError errors={[errors.roleName]} />
                        </Field>
                      )}
                    />

                    <Field data-invalid={!!errors.phoneNumber}>
                      <FieldLabel htmlFor="user-phone">Phone number</FieldLabel>
                      <div className="flex h-8 overflow-hidden rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20">
                        <span className="flex shrink-0 items-center border-r border-input bg-muted px-2.5 text-sm text-muted-foreground">
                          +254
                        </span>
                        <Input
                          id="user-phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          placeholder="712567983"
                          aria-invalid={!!errors.phoneNumber}
                          className="h-full rounded-none border-0 focus-visible:ring-0"
                          {...register("phoneNumber", {
                            onChange: (event) => {
                              event.target.value = sanitizePhoneNumber(
                                event.target.value
                              )
                            },
                          })}
                        />
                      </div>
                      <FieldError errors={[errors.phoneNumber]} />
                    </Field>
                  </>
                ) : null}
              </FieldGroup>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>

                <Button type="submit" disabled={isSubmittingUser}>
                  {isSubmittingUser ? (
                    <div className="flex items-center gap-x-1">
                      <Spinner className="size-3" />
                      <span className="ml-2">Saving...</span>
                    </div>
                  ) : isEditingUser ? (
                    "Update user"
                  ) : (
                    "Create user"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={usersQuery.isLoading}
        loadingText="Loading users..."
        hasError={usersQuery.isError}
        errorMessage={
          usersQuery.error instanceof Error
            ? usersQuery.error.message
            : "Failed to load users."
        }
        emptyIcon={<UserRound className="size-4" />}
        emptyTitle="No users yet"
        emptyDescription="Create your first user to start managing access."
        searchPlaceholder="Search users..."
        searchButtonText="Search"
        getRowId={(user) => user.id}
      />

      {usersQuery.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            disabled={usersQuery.isFetchingNextPage}
            onClick={() => usersQuery.fetchNextPage()}
          >
            {usersQuery.isFetchingNextPage ? (
              <>
                <Spinner className="size-3" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      ) : null}

      <Drawer
        open={Boolean(viewingUser)}
        onOpenChange={handleViewDrawerOpenChange}
        direction="right"
      >
        <DrawerContent className="data-[drawer-direction=right]:sm:max-w-lg">
          <DrawerHeader className="relative border-b px-6 py-3">
            <DrawerTitle className="pr-8 text-sm">
              {viewingUser?.name ?? "User details"}
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              {viewingUser?.email ?? "View user information"}
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

          {viewingUser ? (
            <div className="overflow-y-auto px-6 pb-24">
              <div className="flex items-center gap-5 border-b py-5">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-md border border-input bg-muted">
                  <UserRound className="size-7 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl font-medium">
                    {viewingUser.name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {viewingUser.role?.name ?? "No role assigned"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5 py-5">
                <SummaryItem label="Verified">
                  <BooleanBadge
                    value={viewingUser.emailVerified}
                    trueLabel="Verified"
                    falseLabel="Unverified"
                  />
                </SummaryItem>
                <SummaryItem label="Role">
                  {viewingUser.role?.name ?? "--"}
                </SummaryItem>
                <SummaryItem label="Employee">
                  {viewingUser.employeeCode ?? "--"}
                </SummaryItem>
              </div>

              <DrawerSection title="Contact">
                <DetailRow label="Name:" value={viewingUser.name} />
                <DetailRow label="Email:" value={viewingUser.email} />
                <DetailRow label="Phone:" value={viewingUser.phoneNumber} />
              </DrawerSection>

              <DrawerSection title="Access">
                <DetailRow label="Role:" value={viewingUser.role?.name} />
                <DetailRow
                  label="Email status:"
                  value={viewingUser.emailVerified ? "Verified" : "Unverified"}
                />
                <DetailRow
                  label="Employee code:"
                  value={viewingUser.employeeCode}
                />
              </DrawerSection>

              <DrawerSection title="Lifecycle">
                <DetailRow
                  label="Created:"
                  value={formatDate(viewingUser.createdAt)}
                />
                <DetailRow
                  label="Updated:"
                  value={formatDate(viewingUser.updatedAt)}
                />
              </DrawerSection>
            </div>
          ) : null}

          {viewingUser ? (
            <DrawerFooter className="absolute right-0 bottom-0 left-0 grid grid-cols-2 gap-2 border-t bg-popover p-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  openEditDialog(viewingUser)
                  setViewingUser(null)
                }}
              >
                <SquarePen />
                Edit
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setDeletingUser(viewingUser)
                  setViewingUser(null)
                }}
              >
                <Trash2 />
                Delete
              </Button>
            </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>

      <Dialog
        open={Boolean(changingRoleUser)}
        onOpenChange={(open) => {
          if (!open) {
            setChangingRoleUser(null)
            setSelectedRole("")
          }
        }}
      >
        <DialogContent className="md:max-w-md">
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              Select a new role for {changingRoleUser?.name ?? "this user"}.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                This is a template. Wire it to your role assignment API.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isChangingRole}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={!selectedRole || isChangingRole}
              onClick={handleChangeRole}
            >
              {isChangingRole ? (
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

      <AlertDialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingUser(null)
          }
        }}
      >
        <AlertDialogContent className="max-w-3xl" size="default">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This is a template for deleting ${deletingUser?.name ?? "this user"}. Add your API call before using it in production.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingUser}>
              No, cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeletingUser}
            >
              {isDeletingUser ? (
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
    </div>
  )
}
