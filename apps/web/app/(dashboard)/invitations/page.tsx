"use client"

import { useMemo, useState } from "react"
import {
  Ban,
  CheckCircle2,
  Clock3,
  Inbox,
  Send,
  TimerOff,
  type LucideIcon,
} from "lucide-react"

import { Card, CardContent } from "@workspace/ui/components/card"
import { DataTable } from "@workspace/ui/components/data-table"
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"
import {
  DetailRow,
  DrawerSection,
  SummaryItem,
} from "@/components/drawer-details"
import { BooleanBadge } from "@/lib/status-badges"
import { formatDate } from "@/lib/utils"
import { cn } from "@workspace/ui/lib/utils"
import { useRevokeInvitationMutation } from "@/hooks/mutations/useInvitation"
import { useFetchInvitations } from "@/hooks/queries/useInvitation"
import {
  getColumns,
  type InvitationAction,
  type InvitationRow,
} from "./columns"
import { type InvitationStatusCounts } from "@/services/invitations"

type InvitationStatusCard = {
  status: keyof InvitationStatusCounts
  label: string
  description: string
  icon: LucideIcon
  iconClassName: string
}

const statusCards: InvitationStatusCard[] = [
  {
    status: "PENDING",
    label: "Pending",
    description: "Invitations waiting for user acceptance",
    icon: Clock3,
    iconClassName: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  },
  {
    status: "ACCEPTED",
    label: "Accepted",
    description: "Invitations that completed account setup",
    icon: CheckCircle2,
    iconClassName: "bg-green-500/10 text-green-700 dark:text-green-300",
  },
  {
    status: "EXPIRED",
    label: "Expired",
    description: "Invitations that passed their expiry time",
    icon: TimerOff,
    iconClassName: "bg-muted text-foreground",
  },
  {
    status: "REVOKED",
    label: "Revoked",
    description: "Invitations manually revoked by an admin",
    icon: Ban,
    iconClassName: "bg-destructive/10 text-destructive dark:bg-destructive/15",
  },
]

export default function InvitationsPage() {
  const invitationsQuery = useFetchInvitations()
  const revokeMutation = useRevokeInvitationMutation()

  const [viewingInvitation, setViewingInvitation] =
    useState<InvitationRow | null>(null)
  const [revokingInvitation, setRevokingInvitation] =
    useState<InvitationAction | null>(null)

  const invitations = invitationsQuery.data?.invitations ?? []
  const counts = invitationsQuery.data?.counts

  const columns = useMemo(
    () =>
      getColumns({
        onViewInvitation: setViewingInvitation,
        onRevokeInvitation: setRevokingInvitation,
      }),
    []
  )

  const handleRevokeInvitation = () => {
    if (!revokingInvitation) return

    toast.promise(revokeMutation.mutateAsync(revokingInvitation.id), {
      loading: "Revoking invitation...",
      success: () => {
        if (viewingInvitation?.id === revokingInvitation.id) {
          setViewingInvitation(null)
        }
        setRevokingInvitation(null)
        return "Invitation revoked successfully"
      },
      error: (err) =>
        err instanceof Error ? err.message : "Failed to revoke invitation",
      position: "top-right",
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="text-lg font-medium tracking-wide">Invitations</h2>
          <p className="text-sm text-muted-foreground">
            Review employee invitations and revoke pending access.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statusCards.map((card) => {
          const Icon = card.icon

          return (
            <Card
              key={card.status}
              className="rounded-lg border-border/80 bg-card/90 shadow-sm"
            >
              <CardContent className="flex min-h-24 items-start justify-between gap-4 py-2">
                <div className="flex min-w-0 flex-col">
                  <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    {card.label}
                  </p>
                  <p className="mt-4 text-3xl font-semibold tracking-normal text-foreground">
                    {counts?.[card.status] ?? 0}
                  </p>
                  <p className="mt-4 text-sm leading-5 text-muted-foreground">
                    {card.description}
                  </p>
                </div>

                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    card.iconClassName
                  )}
                >
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <DataTable
        columns={columns}
        data={invitations}
        isLoading={invitationsQuery.isLoading}
        loadingText="Loading invitations..."
        hasError={invitationsQuery.isError}
        errorMessage={
          invitationsQuery.error instanceof Error
            ? invitationsQuery.error.message
            : "Failed to load invitations."
        }
        emptyIcon={<Inbox className="size-4" />}
        emptyTitle="No invitations yet"
        emptyDescription="Created invitations will appear here."
        searchPlaceholder="Search invitations..."
        searchButtonText="Search"
        getRowId={(invitation) => invitation.id}
      />

      <Drawer
        direction="right"
        open={Boolean(viewingInvitation)}
        onOpenChange={(open) => {
          if (!open) setViewingInvitation(null)
        }}
      >
        <DrawerContent className="overflow-y-auto sm:max-w-md">
          <DrawerHeader>
            <DrawerTitle>Invitation details</DrawerTitle>
            <DrawerDescription>
              {viewingInvitation?.email ?? "Invitation information"}
            </DrawerDescription>
          </DrawerHeader>

          {viewingInvitation ? (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-3 gap-3 rounded-md border bg-muted/30 p-3">
                <SummaryItem label="Role">
                  {viewingInvitation.role?.name ?? "--"}
                </SummaryItem>
                <SummaryItem label="Branch">
                  {viewingInvitation.branch?.name ?? "--"}
                </SummaryItem>
                <SummaryItem label="Used">
                  <BooleanBadge
                    value={viewingInvitation.used}
                    trueLabel="Used"
                    falseLabel="Unused"
                  />
                </SummaryItem>
              </div>

              <DrawerSection title="Invitation">
                <DetailRow label="Email" value={viewingInvitation.email} />
                <DetailRow label="Status" value={viewingInvitation.status} />
                <DetailRow
                  label="Created"
                  value={formatDate(viewingInvitation.createdAt)}
                />
                <DetailRow
                  label="Expires"
                  value={formatDate(viewingInvitation.expiredAt)}
                />
              </DrawerSection>

              <DrawerSection title="People">
                <DetailRow
                  label="Invited By"
                  value={viewingInvitation.invitedBy?.name}
                />
                <DetailRow
                  label="Revoked By"
                  value={viewingInvitation.revokedBy?.name}
                />
              </DrawerSection>

              <DrawerSection title="Timeline">
                <DetailRow
                  label="Used At"
                  value={formatDate(viewingInvitation.usedAt)}
                />
                <DetailRow
                  label="Revoked At"
                  value={formatDate(viewingInvitation.revokedAt)}
                />
              </DrawerSection>
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={Boolean(revokingInvitation)}
        onOpenChange={(open) => {
          if (!open) setRevokingInvitation(null)
        }}
      >
        <AlertDialogContent className="max-w-3xl" size="default">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Ban />
            </AlertDialogMedia>
            <AlertDialogTitle>Revoke this invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This will prevent ${revokingInvitation?.email ?? "this invitee"} from accepting the invitation link.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeMutation.isPending}>
              No, cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleRevokeInvitation}
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending ? (
                <div className="flex items-center gap-x-1">
                  <Spinner className="size-3" />
                  <span>Revoking...</span>
                </div>
              ) : (
                <>
                  <Send className="size-4" />
                  Revoke invitation
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
