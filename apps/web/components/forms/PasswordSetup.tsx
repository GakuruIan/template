"use client"

import { useState } from "react"

// form
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

// icons
import { Eye, EyeOff } from "lucide-react"

// components
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { toast } from "@workspace/ui/components/sonner"

// mutation
import { useAcceptInvitationMutation } from "@/hooks/mutations/useInvitation"

const passwordSchema = z
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
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type PasswordSetupValues = z.infer<typeof passwordSchema>

type PasswordSetupProps = {
  token: string
  onSetupComplete?: () => void
}

export default function PasswordSetup({
  token,
  onSetupComplete,
}: PasswordSetupProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const acceptMutation = useAcceptInvitationMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordSetupValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  function onSubmit(values: PasswordSetupValues) {
    setIsLoading(true)
    toast.promise(
      (async () => {
        const payload = {
          token,
          password: values.password,
        }
        await acceptMutation.mutateAsync(payload)
      })(),
      {
        loading: "Setting up your account...",
        success: () => {
          onSetupComplete?.()

          return "Account setup successfully."
        },
        error: (error) => error.message,
        finally: () => setIsLoading(false),
        position: "top-center",
      }
    )
  }

  return (
    <div className="">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
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
                aria-label={showPassword ? "Hide password" : "Show password"}
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

          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
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

        <Button type="submit" className="h-10 w-full" disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center gap-x-1">
              <Spinner className="size-3" />
              <span className="ml-2">Setting up Account...</span>
            </div>
          ) : (
            "Submit"
          )}
        </Button>
      </form>
    </div>
  )
}
