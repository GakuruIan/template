import { notFound } from "next/navigation"

import { UsersPageClient } from "../users-page-client"
import { getUserRoleRouteConfig } from "../role-config"

type RoleUsersPageProps = {
  params: Promise<{
    role: string
  }>
}

export default async function RoleUsersPage({ params }: RoleUsersPageProps) {
  const { role } = await params
  const roleConfig = getUserRoleRouteConfig(role)

  if (!roleConfig) {
    notFound()
  }

  return <UsersPageClient roleName={roleConfig.roleName} />
}
