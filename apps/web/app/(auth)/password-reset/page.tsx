"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff } from "lucide-react"

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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import { authClient } from "@/lib/auth-client"
import { AuthLogo } from "@/components/auth-logo"

const resetPasswordSchema = z
  .object({
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
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [isResetting, setIsResetting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const router = useRouter()

  const payload = sessionStorage.getItem("reset_flow")

  useEffect(() => {
    if (!payload) {
      router.replace("/forgot-password")
    }
  }, [payload, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: ResetPasswordValues) {
    setIsResetting(true)

    toast.promise(
      (async () => {
        try {
          const { email, otp } = JSON.parse(payload!)

          const { data, error } = await authClient.emailOtp.resetPassword({
            email,
            otp,
            password: values.password,
          })

          if (error) {
            throw new Error(error.message)
          }

          return data
        } catch (error) {
          console.error("Error resetting password reset :", error)
          const message =
            error instanceof Error
              ? error.message
              : "Password reset failed. Please try again."
          throw new Error(message)
        }
      })(),
      {
        loading: "Resetting password...",
        success: () => {
          router.replace("/login")
          sessionStorage.removeItem("reset_flow")
          return {
            message: "Password reset successfully",
            description: "You can now log in with your new password.",
          }
        },
        error: (err: Error) => ({
          message: "Something went wrong",
          description: err.message,
        }),
        finally: () => setIsResetting(false),
        position: "top-center",
      }
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-xl bg-card/90 py-6 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-left">
          <AuthLogo />
          <CardTitle className="text-xl">Reset password</CardTitle>
          <CardDescription>
            Choose a new secure password for your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">New password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a new password"
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
                <FieldDescription>Use at least 8 characters.</FieldDescription>
                <FieldError errors={[errors.password]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm password
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    className="h-10 pr-10 pl-4"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground hover:text-foreground"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <FieldError errors={[errors.confirmPassword]} />
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              className="h-10 w-full"
              disabled={isResetting}
            >
              {isResetting ? (
                <div className="flex items-center gap-x-1">
                  <Spinner className="size-3" />
                  <span className="ml-2">Resetting password...</span>
                </div>
              ) : (
                "Update password"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
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
