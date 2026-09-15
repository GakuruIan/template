"use client"

import { useMemo, useState } from "react"
import { ScrollText, X } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"

import {
  DetailRow,
  DrawerSection,
  SummaryItem,
} from "@/components/drawer-details"
import { useFetchLogs } from "@/hooks/queries/useFetchLogs"
import { DataTable } from "./data-table"
import {
  formatAction,
  formatDateTime,
  getColumns,
  getEntity,
  type AuditLogRow,
} from "./columns"

const formatAuditValue = (value: unknown) => {
  if (value === undefined || value === null) return null

  return JSON.stringify(value, null, 2)
}

const Page = () => {
  const logsQuery = useFetchLogs({ limit: 20 })
  const [viewingLog, setViewingLog] = useState<AuditLogRow | null>(null)
  const [pageIndex, setPageIndex] = useState(0)

  const pages = useMemo(() => logsQuery.data?.pages ?? [], [logsQuery.data])

  const logs = (pages[pageIndex]?.logs ?? []) as AuditLogRow[]
  const hasPreviousPage = pageIndex > 0
  const hasLoadedNextPage = pageIndex < pages.length - 1
  const hasNextPage = hasLoadedNextPage || Boolean(logsQuery.hasNextPage)

  const columns = useMemo(
    () =>
      getColumns({
        onViewLog: setViewingLog,
      }),
    []
  )

  const handleViewDrawerOpenChange = (open: boolean) => {
    if (!open) setViewingLog(null)
  }

  const oldValue = viewingLog ? formatAuditValue(viewingLog.oldValue) : null
  const newValue = viewingLog ? formatAuditValue(viewingLog.newValue) : null

  const handlePreviousPage = () => {
    setPageIndex((currentPage) => Math.max(currentPage - 1, 0))
  }

  const handleNextPage = async () => {
    if (hasLoadedNextPage) {
      setPageIndex((currentPage) => currentPage + 1)
      return
    }

    if (!logsQuery.hasNextPage || logsQuery.isFetchingNextPage) return

    const result = await logsQuery.fetchNextPage()

    if (!result.isError) {
      setPageIndex((currentPage) => currentPage + 1)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="text-lg font-medium tracking-wide">Audit Logs</h2>
          <p className="text-sm text-muted-foreground">
            View system activity and branch audit events.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        isLoading={logsQuery.isLoading}
        loadingText="Loading audit logs..."
        hasError={logsQuery.isError}
        errorMessage={
          logsQuery.error instanceof Error
            ? logsQuery.error.message
            : "Failed to load audit logs."
        }
        emptyIcon={<ScrollText className="size-4" />}
        emptyTitle="No audit logs yet"
        emptyDescription="System activity will appear here once actions are recorded."
        searchPlaceholder="Search audit logs..."
        searchButtonText="Search"
        getRowId={(log) => log.id}
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        isFetching={logsQuery.isFetchingNextPage}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        pageLabel={`Page ${pageIndex + 1}`}
      />

      <Drawer
        open={Boolean(viewingLog)}
        onOpenChange={handleViewDrawerOpenChange}
        direction="right"
      >
        <DrawerContent className="data-[drawer-direction=right]:sm:max-w-xl">
          <DrawerHeader className="relative border-b px-4 py-3">
            <DrawerTitle className="pr-8 text-sm">
              {viewingLog ? formatAction(viewingLog.action) : "Audit log"}
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              {viewingLog ? getEntity(viewingLog) : "View audit log details"}
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

          {viewingLog ? (
            <div className="overflow-y-auto px-4 pb-6">
              <div className="grid grid-cols-3 gap-4 py-4">
                <SummaryItem label="Action">
                  {formatAction(viewingLog.action)}
                </SummaryItem>
                <SummaryItem label="Entity">
                  {getEntity(viewingLog)}
                </SummaryItem>
                <SummaryItem label="Actor">
                  {viewingLog.actor?.name ?? "--"}
                </SummaryItem>
              </div>

              <DrawerSection title="Audit Log">
                <DetailRow label="ID:" value={viewingLog.id} />
                <DetailRow
                  label="Action:"
                  value={formatAction(viewingLog.action)}
                />
                <DetailRow label="Entity:" value={getEntity(viewingLog)} />
                <DetailRow label="Entity ID:" value={viewingLog.entityId} />
                <DetailRow
                  label="Created:"
                  value={formatDateTime(viewingLog.createdAt)}
                />
              </DrawerSection>

              <DrawerSection title="Actor">
                <DetailRow label="Name:" value={viewingLog.actor?.name} />
                <DetailRow label="ID:" value={viewingLog.actor?.id} />
              </DrawerSection>

              {oldValue || newValue ? (
                <DrawerSection title="Changes">
                  {oldValue ? (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Old value
                      </p>
                      <pre className="max-h-72 overflow-auto rounded-md border bg-muted p-3 text-xs whitespace-pre-wrap">
                        {oldValue}
                      </pre>
                    </div>
                  ) : null}

                  {newValue ? (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        New value
                      </p>
                      <pre className="max-h-72 overflow-auto rounded-md border bg-muted p-3 text-xs whitespace-pre-wrap">
                        {newValue}
                      </pre>
                    </div>
                  ) : null}
                </DrawerSection>
              ) : null}
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default Page
