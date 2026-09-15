"use client"

import { ShieldAlert } from "lucide-react"

import { Card, CardContent } from "@workspace/ui/components/card"

type AccessDeniedProps = {
  title?: string
  description?: string
}

export function AccessDenied({
  title = "Page unavailable",
  description = "You do not have permission to view this page.",
}: AccessDeniedProps) {
  return (
    <Card>
      <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-11 items-center justify-center rounded-md border bg-muted">
          <ShieldAlert className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-medium">{title}</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
