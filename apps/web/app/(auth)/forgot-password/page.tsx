"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

// form
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

// icon
import { CircleAlert, Send } from "lucide-react"

// components
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Input } from "@workspace/ui/components/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import { AuthLogo } from "@/components/auth-logo"

// auth
import { authClient, roleRedirect } from "@/lib/auth-client"
import { api } from "@/lib/axios"

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(50, "Email cannot exceed 50 characters.")
    .min(1, "Email is required."),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
type SessionUserWithRole = {
  role?: string | { name?: string | null } | null
}
type AuthSessionResponse = {
  user: SessionUserWithRole
}

async function getCurrentUserRedirect() {
  const { data } = await api.get<AuthSessionResponse>("/auth/session")
  return roleRedirect(data.user.role)
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [isRequesting, setIsRequesting] = useState(false)
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    let cancelled = false

    async function redirectAuthenticatedUser() {
      if (isPending || !session?.user) return

      const redirectTo = await getCurrentUserRedirect()
      if (!cancelled) {
        router.replace(redirectTo)
      }
    }

    void redirectAuthenticatedUser()

    return () => {
      cancelled = true
    }
  }, [isPending, router, session])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: ForgotPasswordValues) {
    setIsRequesting(true)

    toast.promise(
      (async () => {
        try {
          const { data, error } =
            await authClient.emailOtp.requestPasswordReset({
              email: values.email,
            })

          if (error) throw new Error(error.message)

          return data
        } catch (error) {
          console.error("Error requesting password reset :", error)
          const message =
            error instanceof Error
              ? error.message
              : "Password reset failed. Please try again."
          throw new Error(message)
        }
      })(),
      {
        loading: "Sending password reset code...",
        success: () => {
          sessionStorage.setItem("reset_email", values.email)
          router.replace("/password-reset/verify")
          return "Password reset code sent successfully. Check your email"
        },
        error: (err: Error) => err.message,
        finally: () => setIsRequesting(false),
        position: "top-center",
      }
    )
  }

  if (isPending || session?.user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-xl border-border/70 bg-card/95 py-6 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-left">
          <AuthLogo />
          <CardTitle className="text-xl">Forgot your password?</CardTitle>
          <CardDescription>
            Enter your account email and we&apos;ll send a reset code.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary"
            >
              Encrypted link
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary"
            >
              Expires in 15 min
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary"
            >
              Single-use
            </Badge>
          </div>

          <Alert className="border-border/70 bg-muted/30">
            <CircleAlert className="size-4" />
            <AlertDescription className="text-sm text-muted-foreground">
              Use the same email you use to access admin tools.
            </AlertDescription>
          </Alert>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email" className="tracking-[0.12em]">
                  Email Address
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@revealpos.com"
                  className="h-11 border-border/70 bg-muted/20 px-4"
                  {...register("email")}
                />
                <FieldError errors={[errors.email]} />
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isRequesting}
            >
              <Send className="size-4" />
              {isRequesting ? (
                <div className="flex items-center gap-x-1">
                  <Spinner className="size-3" />
                  <span className="ml-2">Sending reset code...</span>
                </div>
              ) : (
                "Send reset code"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Remember password?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Back to login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
