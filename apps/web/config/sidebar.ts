import type { AppRole } from "@/lib/roles"

export type SidebarRole = AppRole

export type SidebarItem = {
  label: string
  href?: string
  icon?: string
  roles: SidebarRole[]
  permissions?: string[]
  children?: SidebarItem[]
}

export type SidebarSection = {
  label: string
  roles: SidebarRole[]
  items: SidebarItem[]
}

const allRoles: SidebarRole[] = ["Platform Admin", "Owner", "Manager"]
const adminRoles: SidebarRole[] = ["Platform Admin", "Owner", "Manager"]
const ownerRoles: SidebarRole[] = ["Platform Admin", "Owner"]

export const sidebarSections: SidebarSection[] = [
  {
    label: "Workspace",
    roles: allRoles,
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: "LayoutDashboard",
        roles: allRoles,
      },
      // {
      //   label: "Reports",
      //   href: "/reports",
      //   icon: "ChartNoAxesCombined",
      //   roles: adminRoles,
      //   permissions: ["reports:view"],
      // },
    ],
  },

  {
    label: "Users Management",
    roles: adminRoles,
    items: [
      {
        label: "Users Management",
        icon: "UsersRound",
        roles: adminRoles,
        children: [
          {
            label: "All",
            href: "/users",
            icon: "UsersRound",
            roles: ["Platform Admin", "Owner"],
            permissions: ["users:view"],
          },
          {
            label: "Admins",
            href: "/users/admins",
            icon: "ShieldCheck",
            roles: ["Platform Admin"],
          },
          {
            label: "Invitations",
            href: "/invitations",
            icon: "MailPlus",
            roles: adminRoles,
            permissions: ["users:view"],
          },
        ],
      },
    ],
  },

  {
    label: "General and Settings",
    roles: adminRoles,
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: "Settings",
        roles: ownerRoles,
        permissions: ["users:update"],
      },
      {
        label: "Configurations",
        icon: "Wrench",
        roles: adminRoles,
        children: [
          {
            label: "Roles & Permissions",
            href: "/roles",
            icon: "ShieldCheck",
            roles: adminRoles,
            permissions: ["roles:view"],
          },
        ],
      },
    ],
  },

  {
    label: "System Logs",
    roles: adminRoles,
    items: [
      {
        label: "Audit Logs",
        href: "/audit-logs",
        icon: "ScrollText",
        roles: ownerRoles,
        permissions: ["users:view"],
      },
    ],
  },
]
