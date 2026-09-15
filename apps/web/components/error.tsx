import {
  EmptyHeader,
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/empty"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"

import { RotateCcw, ShieldAlert } from "lucide-react"

import React from "react"

interface props {
  heading: string
  errorMessage: string
  action?: () => void
}

const ErrorPage: React.FC<props> = ({
  heading,
  errorMessage,
  action,
}: props) => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg bg-card py-6">
        <CardHeader className="pb-0">
          <Empty className="border-0 p-0">
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="size-10 bg-destructive/10 text-destructive"
              >
                <ShieldAlert className="size-5" />
              </EmptyMedia>
              <EmptyTitle className="text-base">{heading}</EmptyTitle>
              <EmptyDescription>
                We could not complete this request.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <ShieldAlert className="size-4" />
            <AlertTitle>Error details</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>

          {action ? (
            <>
              <EmptyContent className="max-w-none">
                <Button type="button" onClick={action}>
                  <RotateCcw data-icon="inline-start" />
                  Try again
                </Button>
              </EmptyContent>
            </>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}

export default ErrorPage
