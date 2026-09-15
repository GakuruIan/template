"use client"
"use no memo"

import * as React from "react"
import { flexRender, type RowData } from "@tanstack/react-table"
import {
  type LegacyColumnDef as ColumnDef,
  getFilteredRowModel,
  getCoreRowModel,
  useLegacyTable as useReactTable,
} from "@tanstack/react-table/legacy"

import { cn } from "@workspace/ui/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Spinner } from "@workspace/ui/components/spinner"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import {
  Search,
  DatabaseZap,
  TriangleAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Separator } from "@workspace/ui/components/separator"

type DataTableProps<TData extends RowData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  loadingText?: string
  isFetching?: boolean
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  onNextPage?: () => void
  onPreviousPage?: () => void
  pageLabel?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: React.ReactNode
  containerClassName?: string
  tableClassName?: string
  headerClassName?: string
  rowClassName?: string
  emptyClassName?: string
  enableSearch?: boolean
  searchPlaceholder?: string
  searchButtonText?: string
  toolbarContent?: React.ReactNode
  hasError?: boolean
  errorMessage?: string
  getRowId?: (originalRow: TData, index: number, parent?: unknown) => string
}

function DataTable<TData extends RowData, TValue>({
  columns,
  data,
  isLoading = false,
  loadingText = "Loading...",
  isFetching = false,
  hasNextPage = false,
  hasPreviousPage = false,
  onNextPage,
  onPreviousPage,
  pageLabel,
  emptyTitle = "No results found",
  emptyDescription = "Try adjusting your filters or add new records.",
  emptyIcon,
  containerClassName,
  tableClassName,
  headerClassName,
  rowClassName,
  emptyClassName,
  enableSearch = true,
  searchPlaceholder = "Search records...",
  searchButtonText = "Search",
  toolbarContent,
  hasError = false,
  errorMessage = "Something went wrong while loading data. Please try again.",
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")

  const table = useReactTable({
    data,
    columns: columns as unknown as ColumnDef<TData, unknown>[],
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    getRowId,
  })

  const colSpan = Math.max(columns.length, 1)
  const hasSearchTerm = globalFilter.trim().length > 0
  const showPagination = hasNextPage || hasPreviousPage

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-card-border dark:bg-card dark:shadow-none",
        containerClassName
      )}
    >
      {enableSearch || toolbarContent ? (
        <div className="space-y-4 px-2">
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            {enableSearch ? (
              <form
                className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault()
                  setGlobalFilter(searchInput.trim())
                }}
              >
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 sm:max-w-sm"
                />

                <Button type="submit" className="h-9 sm:w-auto">
                  <Search className="size-4" />
                  <span>{searchButtonText}</span>
                </Button>
              </form>
            ) : null}

            {toolbarContent ? (
              <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
                {toolbarContent}
              </div>
            ) : null}
          </div>

          <Separator />
        </div>
      ) : null}

      <div className="w-full">
        <Table className={cn("w-full table-fixed", tableClassName)}>
          <TableHeader className={cn("bg-muted/45", headerClassName)}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {hasError ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="p-0">
                  <Empty
                    className={cn(
                      "m-0 w-full max-w-full border border-dashed p-5 px-6",
                      emptyClassName
                    )}
                  >
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <TriangleAlert className="size-4 text-destructive" />
                      </EmptyMedia>
                      <EmptyTitle>Error occurred</EmptyTitle>
                      <EmptyDescription>{errorMessage}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="h-28">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Spinner className="size-4" />
                    <span className="text-sm">{loadingText}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={rowClassName}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="align-middle break-words"
                      style={{ width: `${cell.column.getSize()}px` }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={colSpan} className="p-6">
                  <Empty
                    className={cn("w-full max-w-full p-5 px-6", emptyClassName)}
                  >
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        {emptyIcon ?? <DatabaseZap className="size-4" />}
                      </EmptyMedia>
                      <EmptyTitle>
                        {hasSearchTerm ? "No results found" : "No records yet"}
                      </EmptyTitle>
                      <EmptyDescription>
                        {hasSearchTerm
                          ? "Try adjusting your filters or add new records."
                          : "There are no records."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination ? (
        <div className="flex items-center justify-between border-t bg-card px-4 py-3">
          {pageLabel ? (
            <span className="text-sm text-muted-foreground">{pageLabel}</span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousPage}
              disabled={!hasPreviousPage || isFetching}
            >
              <ChevronLeft className="size-4" />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={!hasNextPage || isFetching}
            >
              <span>Next</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export { DataTable }
export type { DataTableProps }
