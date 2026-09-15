"use client"

import type { UIEvent } from "react"

import { Spinner } from "@workspace/ui/components/spinner"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@workspace/ui/components/select"

type SearchableSelectOption = {
  value: string
  label: string
  description?: string
}

type SearchableSelectProps = {
  id?: string
  value?: string
  selectedLabel?: string
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  searchValue: string
  emptyText?: string
  loadingText?: string
  isLoading?: boolean
  isFetchingMore?: boolean
  hasMore?: boolean
  disabled?: boolean
  invalid?: boolean
  onValueChange: (value: string) => void
  onSearchChange: (value: string) => void
  onOpenChange?: (open: boolean) => void
  onLoadMore?: () => void
}

export function SearchableSelect({
  id,
  value,
  selectedLabel,
  options,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  searchValue,
  emptyText = "No record found",
  loadingText = "Loading...",
  isLoading = false,
  isFetchingMore = false,
  hasMore = false,
  disabled = false,
  invalid = false,
  onValueChange,
  onSearchChange,
  onOpenChange,
  onLoadMore,
}: SearchableSelectProps) {
  const selectedOption = options.find((option) => option.value === value)
  const triggerLabel = selectedLabel?.trim() || selectedOption?.label
  const canLoadMore = hasMore && !isLoading && !isFetchingMore

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!onLoadMore || !canLoadMore) return

    const target = event.currentTarget
    const distanceFromBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight

    if (distanceFromBottom <= 24) {
      onLoadMore()
    }
  }

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      onOpenChange={onOpenChange}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full" aria-invalid={invalid}>
        <span
          className={
            triggerLabel ? "truncate" : "truncate text-muted-foreground"
          }
        >
          {triggerLabel ?? placeholder}
        </span>
      </SelectTrigger>
      <SelectContent position="popper" className="p-1" onScroll={handleScroll}>
        <div
          className="p-1"
          onKeyDown={(event) => {
            event.stopPropagation()
          }}
        >
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
            <Spinner className="size-3" />
            {loadingText}
          </div>
        ) : options.length ? (
          <>
            <SelectGroup>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
            {isFetchingMore ? (
              <div className="flex items-center justify-center px-2 py-2 text-muted-foreground">
                <Spinner className="size-3" />
              </div>
            ) : null}
          </>
        ) : (
          <p className="px-2 py-3 text-sm text-muted-foreground">{emptyText}</p>
        )}
      </SelectContent>
    </Select>
  )
}
