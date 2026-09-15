"use client"

import Link from "next/link"
import { useState } from "react"
import { CheckCircle2 } from "lucide-react"

// components
import { Skeleton } from "@workspace/ui/components/skeleton"
import ErrorPage from "@/components/error"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
} from "@workspace/ui/components/card"
import { AuthLogo } from "@/components/auth-logo"

// query
import { useFetchInvitation } from "@/hooks/queries/useInvitation"

import { useSearchParams } from "next/navigation"
import PasswordSetup from "@/components/forms/PasswordSetup"

function InvitationVerificationSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-xl bg-card py-6 backdrop-blur-sm">
        <CardHeader className="space-y-3 text-left">
          <Skeleton className="h-9 w-36" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>

          <Skeleton className="ml-auto h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

function InvitationSetupSuccessCard() {
  return (
    <div className="flex h-screen items-center justify-center px-4">
      <Card className="w-full max-w-xl bg-card py-6 backdrop-blur-sm">
        <CardHeader className="items-center space-y-4 text-center">
          <div className="flex items-center justify-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-green-700/60 text-primary">
              <CheckCircle2 className="size-8 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl">Account setup complete</CardTitle>
            <CardDescription>
              Your password has been created successfully. You can now sign in to your account.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Button asChild className="h-10 w-full">
            <Link href="/login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  const [completedRole, setCompletedRole] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const { data, isLoading, error, refetch } = useFetchInvitation(token)

  if (completedRole) {
    return <InvitationSetupSuccessCard />
  }

  if (!token)
    return (
      <ErrorPage
        heading="Missing token"
        errorMessage="No invitation token found."
      />
    )

  if (isLoading) {
    return <InvitationVerificationSkeleton />
  }

  if (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Invitation verification failed. Please try again."

    return (
      <ErrorPage
        heading="Invitation verification failed"
        errorMessage={errorMessage}
        action={() => refetch()}
      />
    )
  }

  if (!data) {
    return (
      <ErrorPage
        heading="Invitation unavailable"
        errorMessage="We could not verify this invitation. Please try again."
        action={() => refetch()}
      />
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-xl bg-card py-6 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-left">
          <AuthLogo />

          <CardTitle className="text-xl">Accept Invitation</CardTitle>

          <CardDescription>
            You've been invited to join the organization. Create your password to activate your account and get started.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <PasswordSetup
            token={token}
            onSetupComplete={() => setCompletedRole(data.role.name)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
