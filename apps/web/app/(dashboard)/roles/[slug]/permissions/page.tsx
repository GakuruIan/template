"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, KeyRound } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"

import { useSyncRolePermissions } from "@/hooks/mutations/useRole"
import { useFetchPermissions } from "@/hooks/queries/useFetchPermissions"
import { useFetchRoleBySlug } from "@/hooks/queries/useFetchRole"
import type { PermissionListItem } from "@/types/types"

type PermissionGroup = {
  resource: string
  permissions: PermissionListItem[]
}

function getSlugParam(slug?: string | string[]) {
  if (Array.isArray(slug)) return slug[0]
  return slug
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function getPermissionAction(permissionKey: string) {
  return permissionKey.split(":")[1] ?? permissionKey
}

function groupPermissions(permissions: PermissionListItem[]) {
  const groups = permissions.reduce<Record<string, PermissionListItem[]>>(
    (acc, permission) => {
      const resource = permission.key.split(":")[0] ?? "other"
      acc[resource] = [...(acc[resource] ?? []), permission]
      return acc
    },
    {}
  )

  return Object.entries(groups).map<PermissionGroup>(
    ([resource, permissions]) => ({
      resource,
      permissions,
    })
  )
}

export default function RolePermissionsPage() {
  const router = useRouter()
  const params = useParams<{ slug?: string | string[] }>()
  const slug = getSlugParam(params.slug)
  const roleQuery = useFetchRoleBySlug(slug)
  const permissionsQuery = useFetchPermissions()
  const syncPermissionsMutation = useSyncRolePermissions()
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    []
  )

  const assignedPermissionIds = useMemo(
    () =>
      roleQuery.data?.permissions.map(({ permission }) => permission.id) ?? [],
    [roleQuery.data]
  )

  const permissionGroups = useMemo(
    () => groupPermissions(permissionsQuery.data ?? []),
    [permissionsQuery.data]
  )

  const allPermissionIds = useMemo(
    () => permissionsQuery.data?.map((permission) => permission.id) ?? [],
    [permissionsQuery.data]
  )

  const selectedCount = selectedPermissionIds.length
  const allPermissionsSelected =
    allPermissionIds.length > 0 && selectedCount === allPermissionIds.length
  const somePermissionsSelected =
    selectedCount > 0 && selectedCount < allPermissionIds.length
  const assignAllChecked = somePermissionsSelected
    ? "indeterminate"
    : allPermissionsSelected
  const hasChanges = useMemo(() => {
    if (assignedPermissionIds.length !== selectedPermissionIds.length) {
      return true
    }

    return assignedPermissionIds.some(
      (permissionId) => !selectedPermissionIds.includes(permissionId)
    )
  }, [assignedPermissionIds, selectedPermissionIds])
  const isSaving = syncPermissionsMutation.isPending
  const isReadOnly = Boolean(
    roleQuery.data?.isSystem || roleQuery.data?.deletedAt
  )
  const readOnlyMessage = roleQuery.data?.isSystem
    ? "System role permissions cannot be changed."
    : roleQuery.data?.deletedAt
      ? "Deleted role permissions cannot be changed."
      : null

  useEffect(() => {
    setSelectedPermissionIds(assignedPermissionIds)
  }, [assignedPermissionIds])

  const togglePermission = (permissionId: string, checked: boolean) => {
    setSelectedPermissionIds((current) =>
      checked
        ? Array.from(new Set([...current, permissionId]))
        : current.filter((id) => id !== permissionId)
    )
  }

  const isLoading = roleQuery.isLoading || permissionsQuery.isLoading
  const error =
    roleQuery.error instanceof Error
      ? roleQuery.error.message
      : permissionsQuery.error instanceof Error
        ? permissionsQuery.error.message
        : null

  const handleSavePermissions = () => {
    if (!roleQuery.data || isReadOnly) return

    toast.promise(
      syncPermissionsMutation
        .mutateAsync({
          roleId: roleQuery.data.id,
          permissionIds: selectedPermissionIds,
        })
        .then(async () => {
          await roleQuery.refetch()
        }),
      {
        loading: "Saving permissions...",
        success: "Permissions saved successfully",
        error: (err) =>
          err instanceof Error ? err.message : "Failed to save permissions",
        position: "top-right",
      }
    )
  }

  return (
    <div className="space-y-5 pb-20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="text-lg font-medium tracking-wide">
            Role Permissions
          </h2>
          <p className="text-sm text-muted-foreground">
            {roleQuery.data
              ? `${roleQuery.data.name} permissions`
              : "Manage assigned role permissions."}
          </p>
        </div>
        <Button variant="outline" className="sm:ml-auto" asChild>
          <Link href="/roles" className="flex items-center gap-x-2">
            <ArrowLeft />
            Roles
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-11 items-center justify-center rounded-md border bg-muted">
              <KeyRound className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-medium">Permissions unavailable</h2>
              <p className="max-w-md text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : permissionGroups.length ? (
        <div className="space-y-4">
          {readOnlyMessage ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {readOnlyMessage}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent>
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={assignAllChecked}
                  disabled={isReadOnly || isSaving}
                  onCheckedChange={(value) =>
                    setSelectedPermissionIds(
                      value === true ? allPermissionIds : []
                    )
                  }
                  aria-label="Assign all permissions"
                  className="mt-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    Assign all permissions
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {selectedCount} of {allPermissionIds.length} permissions
                    selected
                  </span>
                </span>
              </label>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {permissionGroups.map((group) => (
              <Card key={group.resource}>
                <CardHeader className="border-b">
                  <CardTitle>{formatLabel(group.resource)}</CardTitle>
                  <CardDescription>
                    {group.permissions.length} permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {group.permissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-start gap-3 rounded-md py-1 text-sm hover:bg-muted/40"
                    >
                      <Checkbox
                        checked={selectedPermissionIds.includes(permission.id)}
                        disabled={isReadOnly || isSaving}
                        onCheckedChange={(value) =>
                          togglePermission(permission.id, Boolean(value))
                        }
                        aria-label={permission.key}
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">
                          {formatLabel(getPermissionAction(permission.key))}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {permission.description ?? permission.key}
                        </span>
                      </span>
                    </label>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-11 items-center justify-center rounded-md border bg-muted">
              <KeyRound className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-medium">No permissions found</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Permissions will appear here once they are added.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && permissionGroups.length ? (
        <div className="fixed right-0 bottom-0 left-0 z-30 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:left-(--sidebar-width)">
          <div className="mx-auto flex max-w-7xl items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => router.push("/roles")}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                isSaving || isReadOnly || !hasChanges || !roleQuery.data
              }
              onClick={handleSavePermissions}
            >
              {isSaving ? (
                <span className="flex items-center gap-x-1">
                  <Spinner className="size-3" />
                  Saving...
                </span>
              ) : (
                "Save Permissions"
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
