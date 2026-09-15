"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// form
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

// components
import { Button } from "@workspace/ui/components/button"
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"
import { toast } from "@workspace/ui/components/sonner"
import { AuthLogo } from "@/components/auth-logo"

const verifyResetCodeSchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code"),
})

type VerifyResetCodeValues = z.infer<typeof verifyResetCodeSchema>

export default function VerifyResetCodePage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("reset_email")
    if (!storedEmail) {
      router.replace("/forgot-password")
      return
    }
    setEmail(storedEmail)
  }, [router])

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VerifyResetCodeValues>({
    resolver: zodResolver(verifyResetCodeSchema),
    defaultValues: { otp: "" },
  })

  async function onSubmit(values: VerifyResetCodeValues) {
    try {
      if (!email) {
        router.replace("/forgot-password")
        return
      }

      sessionStorage.setItem(
        "reset_flow",
        JSON.stringify({
          otp: values.otp,
          email: email,
        })
      )
      router.push("/password-reset")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Password reset failed. Please try again."
      toast.error("An error occurred", {
        description: message,
      })
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-xl bg-card/90 py-6 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-left">
          <AuthLogo />
          <CardTitle className="text-xl">Confirm reset code</CardTitle>
          <CardDescription>
            Enter the 6-digit password reset code sent to your email.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="otp">Reset code</FieldLabel>
                <InputOTP
                  id="otp"
                  maxLength={6}
                  value={watch("otp")}
                  onChange={(value) =>
                    setValue("otp", value, { shouldValidate: true })
                  }
                  containerClassName="w-full"
                >
                  <InputOTPGroup className="grid w-full grid-cols-6">
                    <InputOTPSlot index={0} className="h-14 w-full text-lg" />
                    <InputOTPSlot index={1} className="h-14 w-full text-lg" />
                    <InputOTPSlot index={2} className="h-14 w-full text-lg" />
                    <InputOTPSlot index={3} className="h-14 w-full text-lg" />
                    <InputOTPSlot index={4} className="h-14 w-full text-lg" />
                    <InputOTPSlot index={5} className="h-14 w-full text-lg" />
                  </InputOTPGroup>
                </InputOTP>
                <FieldError errors={[errors.otp]} className="text-center" />
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              className="h-10 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Confirming..." : "Confirm code"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Didn&apos;t receive a code?{" "}
              <Link
                href="/forgot-password"
                className="font-medium text-primary hover:underline"
              >
                Request another
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
