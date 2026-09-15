"use client"

import type { ReactNode } from "react"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

const formatDrawerValue = (value?: string | null) => value || "--"

export function SummaryItem({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] font-medium text-muted-foreground">
        {label}
      </p>
      <div className="truncate text-xs font-medium">{children}</div>
    </div>
  )
}

export function DetailRow({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 whitespace-pre-line text-foreground">
        {formatDrawerValue(value)}
      </span>
    </div>
  )
}

export function DrawerSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-t py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold">{title}</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
        >
          <MoreHorizontal />
          <span className="sr-only">{title} options</span>
        </Button>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
