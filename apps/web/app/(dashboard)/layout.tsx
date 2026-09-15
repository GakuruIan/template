"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { AppSidebarShell } from "@/components/app-sidebar"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/axios"
import { normalizeRole, type SessionRole } from "@/lib/roles"

type SessionUserWithRole = {
  role?: SessionRole
}

type AuthSessionResponse = {
  user: SessionUserWithRole
}

const adminRoles = ["Platform Admin", "Owner", "Manager"]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [canRender, setCanRender] = useState(false)
  const [isCheckingRole, setIsCheckingRole] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function checkAccess() {
      if (isPending) return

      if (!session?.user) {
        setCanRender(false)
        setIsCheckingRole(false)
        router.replace("/login")
        return
      }

      setCanRender(false)
      setIsCheckingRole(true)

      try {
        const { data } = await api.get<AuthSessionResponse>("/auth/session")
        if (cancelled) return

        const role = normalizeRole(data.user.role)

        if (!role) {
          router.replace("/login")
          return
        }

        if (!adminRoles.includes(role)) {
          router.replace("/login")
          return
        }

        setCanRender(true)
      } catch {
        if (!cancelled) {
          router.replace("/login")
        }
      } finally {
        if (!cancelled) {
          setIsCheckingRole(false)
        }
      }
    }

    void checkAccess()

    return () => {
      cancelled = true
    }
  }, [isPending, router, session])

  if (isPending || isCheckingRole || !session?.user || !canRender) return null

  return <AppSidebarShell>{children}</AppSidebarShell>
}
