"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import * as Icons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTheme } from "next-themes"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@workspace/ui/components/sidebar"

import {
  sidebarSections,
  type SidebarItem,
  type SidebarRole,
} from "@/config/sidebar"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/axios"
import { normalizeRole } from "@/lib/roles"
import { canAccess } from "@/hooks/use-permissions"
import { cn } from "@workspace/ui/lib/utils"

import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

import { Separator } from "@workspace/ui/components/separator"

function resolveIcon(name?: string): LucideIcon {
  if (!name) return Icons.Circle
  const icon = (Icons as unknown as Record<string, LucideIcon | undefined>)[
    name
  ]
  return icon ?? Icons.Circle
}

function hrefIsActive(pathname: string, currentSearch: string, href?: string) {
  if (!href) return false

  const [hrefPath, hrefSearch = ""] = href.split("?")

  if (pathname !== hrefPath) return false
  if (!hrefSearch) return true

  const hrefParams = new URLSearchParams(hrefSearch)
  const currentParams = new URLSearchParams(currentSearch)

  return Array.from(hrefParams.entries()).every(
    ([key, value]) => currentParams.get(key) === value
  )
}

function itemIsActive(
  pathname: string,
  currentSearch: string,
  item: SidebarItem
) {
  if (item.children?.length) {
    return item.children.some((child) =>
      hrefIsActive(pathname, currentSearch, child.href)
    )
  }

  return hrefIsActive(pathname, currentSearch, item.href)
}

type SidebarSessionUser = {
  name?: string | null
  email?: string | null
  role?: string | { name?: string | null } | null
  permissions?: readonly string[] | null
}

type AuthSessionResponse = {
  user: SidebarSessionUser
}

function mapSessionRole(role?: SidebarSessionUser["role"]): SidebarRole | null {
  return normalizeRole(role)
}

function itemIsAllowed(
  item: SidebarItem,
  role: SidebarRole | null,
  user: SidebarSessionUser | null | undefined
) {
  if (!role || !item.roles.includes(role)) return false
  if (role === "Platform Admin") return true
  if (!item.permissions?.length) return true

  return item.permissions.every((permission) => canAccess(user, permission))
}

function filterByRole(
  items: SidebarItem[],
  role: SidebarRole | null,
  user: SidebarSessionUser | null | undefined
): SidebarItem[] {
  if (!role) return []

  return items
    .filter((item) => itemIsAllowed(item, role, user))
    .map((item) => {
      if (!item.children?.length) return item

      const filteredChildren = item.children.filter((child) =>
        itemIsAllowed(child, role, user)
      )
      return {
        ...item,
        children: filteredChildren,
      }
    })
    .filter(
      (item) => !item.children || item.children.length > 0 || Boolean(item.href)
    )
}

function SidebarNav() {
  const { state } = useSidebar()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSearch = searchParams.toString()
  const { data: session, isPending } = authClient.useSession()
  const [authzUser, setAuthzUser] = useState<SidebarSessionUser | null>(null)
  const sessionUser =
    authzUser ?? (session?.user as SidebarSessionUser | undefined)
  const displayName = sessionUser?.name?.trim() || "User"
  const userEmail = sessionUser?.email || "user@marketsquare.com"
  const avatarLetter = displayName.charAt(0).toUpperCase()
  const currentRole = mapSessionRole(sessionUser?.role)

  useEffect(() => {
    let cancelled = false

    async function fetchAuthorizationUser() {
      if (isPending) return

      if (!session?.user) {
        setAuthzUser(null)
        return
      }

      try {
        const { data } = await api.get<AuthSessionResponse>("/auth/session")
        if (!cancelled) {
          setAuthzUser(data.user)
        }
      } catch {
        if (!cancelled) {
          setAuthzUser(null)
        }
      }
    }

    void fetchAuthorizationUser()

    return () => {
      cancelled = true
    }
  }, [isPending, session])

  const visibleSections = useMemo(() => {
    return sidebarSections
      .filter((section) =>
        currentRole ? section.roles.includes(currentRole) : false
      )
      .map((section) => ({
        ...section,
        items: filterByRole(section.items, currentRole, sessionUser),
      }))
      .filter((section) => section.items.length > 0)
  }, [currentRole, sessionUser])

  const [openMap, setOpenMap] = useState<Record<string, boolean>>({})

  const initialOpen = useMemo(() => {
    const map: Record<string, boolean> = {}
    for (const section of visibleSections) {
      for (const item of section.items) {
        if (item.children?.length) {
          map[item.label] = itemIsActive(pathname, currentSearch, item)
        }
      }
    }
    return map
  }, [currentSearch, pathname, visibleSections])

  const mergedOpenMap = { ...initialOpen, ...openMap }
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      className="font-sans [&_[data-sidebar=sidebar]]:border-border [&_[data-sidebar=sidebar]]:bg-card/90 [&_[data-sidebar=sidebar]]:shadow-2xl [&_[data-sidebar=sidebar]]:shadow-black/10 [&_[data-sidebar=sidebar]]:backdrop-blur-xl dark:[&_[data-sidebar=sidebar]]:bg-card/80"
    >
      <SidebarHeader className="px-3 pt-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2 px-1">
          <Icons.Layers2 className="size-6 text-sidebar-foreground" />
          <span
            className={cn(
              "truncate text-sm font-bold text-sidebar-foreground/80 transition-opacity",
              isCollapsed && "hidden"
            )}
          >
            Gakuru System
          </span>
        </div>
        <Separator />
      </SidebarHeader>

      <SidebarContent className="gap-1">
        {isPending
          ? null
          : visibleSections.map((section) => (
              <SidebarGroup key={section.label} className="py-2">
                <SidebarGroupLabel className="h-7 text-sm font-semibold tracking-wide">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {section.items.map((item) => {
                      const ItemIcon = resolveIcon(item.icon)
                      const hasChildren = Boolean(item.children?.length)
                      const isActive = itemIsActive(
                        pathname,
                        currentSearch,
                        item
                      )
                      const isOpen = mergedOpenMap[item.label]

                      if (!hasChildren) {
                        if (!item.href) return null

                        return (
                          <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton
                              asChild
                              data-active={isActive}
                              tooltip={item.label}
                              className="h-9 px-2.5"
                            >
                              <Link href={item.href}>
                                <ItemIcon />
                                <span className="font-medium tracking-normal">
                                  {item.label}
                                </span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      }

                      return (
                        <SidebarMenuItem key={item.label}>
                          <SidebarMenuButton
                            type="button"
                            data-active={isActive}
                            tooltip={item.label}
                            className="h-9 px-2.5"
                            onClick={() =>
                              setOpenMap((prev) => ({
                                ...prev,
                                [item.label]: !isOpen,
                              }))
                            }
                          >
                            <ItemIcon />
                            <span className="font-medium tracking-wide">
                              {item.label}
                            </span>
                            <Icons.ChevronRight
                              className={cn(
                                "ml-auto transition-transform duration-200",
                                isOpen && "rotate-90"
                              )}
                            />
                          </SidebarMenuButton>

                          {isOpen ? (
                            isCollapsed ? (
                              <div className="absolute top-0 left-full z-30 ml-2 min-w-52 rounded-lg border border-sidebar-border bg-card/95 p-2 shadow-lg backdrop-blur-xl">
                                <p className="mb-1 px-2 text-xs font-semibold tracking-wide text-muted-foreground">
                                  {item.label}
                                </p>
                                <div className="flex flex-col gap-1">
                                  {item.children?.map((child) => {
                                    if (!child.href) return null

                                    const ChildIcon = resolveIcon(child.icon)
                                    const childActive = hrefIsActive(
                                      pathname,
                                      currentSearch,
                                      child.href
                                    )

                                    return (
                                      <Link
                                        key={child.label}
                                        href={child.href}
                                        className={cn(
                                          "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                          childActive &&
                                            "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                        )}
                                        onClick={() =>
                                          setOpenMap((prev) => ({
                                            ...prev,
                                            [item.label]: false,
                                          }))
                                        }
                                      >
                                        <ChildIcon className="size-4" />
                                        <span className="font-medium tracking-tight">
                                          {child.label}
                                        </span>
                                      </Link>
                                    )
                                  })}
                                </div>
                              </div>
                            ) : (
                              <SidebarMenuSub className="py-1">
                                {item.children?.map((child) => {
                                  if (!child.href) return null

                                  const ChildIcon = resolveIcon(child.icon)
                                  const childActive = hrefIsActive(
                                    pathname,
                                    currentSearch,
                                    child.href
                                  )

                                  return (
                                    <SidebarMenuSubItem key={child.label}>
                                      <SidebarMenuSubButton
                                        asChild
                                        data-active={childActive}
                                        className="h-8 px-2.5"
                                      >
                                        <Link href={child.href}>
                                          <ChildIcon />
                                          <span className="font-medium tracking-tight">
                                            {child.label}
                                          </span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  )
                                })}
                              </SidebarMenuSub>
                            )
                          ) : null}
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 px-3 pb-4">
        {isPending ? null : (
          <div className="flex items-center gap-3 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/45 p-2 group-data-[collapsible=icon]:justify-center">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-foreground text-xs font-semibold text-sidebar">
              {avatarLetter}
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate font-mono text-xs text-sidebar-foreground/70">
                {userEmail}
              </p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

function pageTitleFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean)
  if (!parts.length) return "Dashboard"

  const leaf = parts[parts.length - 1] ?? "dashboard"
  return leaf
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ")
}

function AdminTopbar() {
  const pathname = usePathname()
  const { data: session } = authClient.useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const router = useRouter()

  const userName = session?.user?.name || "User"
  const userEmail = session?.user?.email || "user@marketsquare.com"
  const pageTitle = pageTitleFromPath(pathname)

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-20 border-b bg-white backdrop-blur-xl dark:border-border/70 dark:bg-background">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <div className="h-5 w-px bg-border" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Admin workspace
            </p>
            <h1 className="text-base font-semibold tracking-wide">
              {pageTitle}
            </h1>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <Icons.Bell className="size-4" />
              <span className="sr-only">Notifications</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              <div className="relative size-4">
                <Icons.Sun
                  className={cn(
                    "absolute inset-0 m-auto size-4 transition-all duration-300 ease-out",
                    resolvedTheme === "dark"
                      ? "scale-0 rotate-90 opacity-0"
                      : "scale-100 rotate-0 opacity-100"
                  )}
                />
                <Icons.Moon
                  className={cn(
                    "absolute inset-0 m-auto size-4 transition-all duration-300 ease-out",
                    resolvedTheme === "dark"
                      ? "scale-100 rotate-0 opacity-100"
                      : "scale-0 -rotate-90 opacity-0"
                  )}
                />
              </div>
              <span className="sr-only">Toggle theme</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-9 gap-2 px-3 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="max-w-32 truncate text-sm font-medium">
                {userName}
              </span>
              <Icons.ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  open && "rotate-180"
                )}
              />
            </Button>
          </div>

          {open ? (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-popover/95 p-1 shadow-xl shadow-black/10 backdrop-blur-xl">
              <div className="border-b border-border px-2 py-2">
                <p className="truncate text-sm font-semibold">{userName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {userEmail}
                </p>
              </div>

              <button
                type="button"
                className="mt-1 flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                <Icons.UserRound className="size-4" />
                <span>Profile</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-destructive hover:bg-accent"
                onClick={async () => {
                  setOpen(false)
                  router.replace("/login")
                  await authClient.signOut()
                }}
              >
                <Icons.LogOut className="size-4" />
                <span>Sign out</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export function AppSidebarShell({ children }: { children: ReactNode }) {
  const { isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-panel p-4 dark:bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-5" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider className="bg-panel dark:bg-background">
      <SidebarNav />
      <SidebarInset className="min-h-screen bg-panel text-foreground dark:bg-background">
        <AdminTopbar />
        <main className="mx-auto w-full sm:px-2 sm:py-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
