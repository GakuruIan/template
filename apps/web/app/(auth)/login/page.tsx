"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

// form
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

// icons
import { Eye, EyeOff } from "lucide-react"

// components
import { Button } from "@workspace/ui/components/button"
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
import { authClient, roleRedirect } from "@/lib/auth-client"
import { api } from "@/lib/axios"

// routing
import { useRouter } from "next/navigation"

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(50, "Password cannot exceed 50 characters.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/\d/, "Password must contain at least one number.")
    .regex(
      /[@$!%*?&]/,
      "Password must contain at least one special character (@, $, !, %, *, ?, &)."
    ),
})

type LoginValues = z.infer<typeof loginSchema>
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

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false)

  const router = useRouter()

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
  }, [router, isPending, session])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginValues) {
    setIsSubmittingLogin(true)

    const { email, password } = values

    toast.promise(
      (async () => {
        try {
          const { error } = await authClient.signIn.email({
            email,
            password,
          })

          if (error) {
            throw new Error(error?.message)
          }

          return {
            redirectTo: await getCurrentUserRedirect(),
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Login failed. Please try again."
          throw new Error(message)
        }
      })(),
      {
        loading: "Signing in...",
        success: (data) => {
          router.replace(data.redirectTo)
          return "Login successfull"
        },
        error: (err: Error) => err.message,
        finally: () => setIsSubmittingLogin(false),
        position: "top-center",
      }
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-xl bg-card py-6 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-left">
          <AuthLogo />
          <CardTitle className="text-xl">Welcome Back</CardTitle>

          <CardDescription>
            Sign in to access your dashboard and oversee daily operations.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  className="h-10 px-4"
                  {...register("email")}
                />
                <FieldError errors={[errors.email]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-10 pr-10 pl-4"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <FieldError errors={[errors.password]} />
              </Field>
            </FieldGroup>

            <div className="text-right text-sm">
              <Link
                href="/forgot-password"
                className="text-muted-foreground hover:text-foreground"
              >
                Forgot password
              </Link>
            </div>

            <Button
              type="submit"
              className="h-10 w-full"
              disabled={isSubmittingLogin}
            >
              {isSubmittingLogin ? (
                <div className="flex items-center gap-x-1">
                  <Spinner className="size-3" />
                  <span className="ml-2">Signing in...</span>
                </div>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
