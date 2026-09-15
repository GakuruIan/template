import { randomBytes, randomUUID, scrypt } from "node:crypto"

import { prisma } from "../src/client.js"

const PLATFORM_ADMIN_ROLE = "Platform Admin"
const OWNER_ROLE = "Owner"
const DEFAULT_ADMIN_EMAIL = "admin@template.com"
const DEFAULT_ADMIN_PASSWORD = "Admin123!"
const DEFAULT_ADMIN_NAME = "Platform Admin"

const DEFAULT_PERMISSIONS = [
  { key: "dashboard:view", description: "View dashboard" },
  { key: "users:view", description: "View users" },
  { key: "users:create", description: "Create users" },
  { key: "users:update", description: "Update users" },
  { key: "users:delete", description: "Delete users" },
  { key: "permissions:view", description: "View permissions" },
  { key: "permissions:create", description: "Create permissions" },
  { key: "permissions:delete", description: "Delete permissions" },
  { key: "roles:view", description: "View roles" },
  { key: "roles:create", description: "Create roles" },
  { key: "roles:update", description: "Update roles" },
  { key: "roles:delete", description: "Delete roles" },
  { key: "roles:restore", description: "Restore roles" },
  { key: "invitations:view", description: "View invitations" },
  { key: "invitations:accept", description: "Accept invitations" },
  { key: "invitations:revoke", description: "Revoke invitations" },
  { key: "auditlogs:view", description: "View audit logs" },
] as const

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  [PLATFORM_ADMIN_ROLE]: DEFAULT_PERMISSIONS.map(
    (permission) => permission.key
  ),
  [OWNER_ROLE]: DEFAULT_PERMISSIONS.filter((permission) =>
    permission.key.startsWith("roles:")
  ).map((permission) => permission.key),
}

const SCRYPT_CONFIG = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
} as const

function generateSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function generateKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      SCRYPT_CONFIG.dkLen,
      {
        N: SCRYPT_CONFIG.N,
        r: SCRYPT_CONFIG.r,
        p: SCRYPT_CONFIG.p,
        maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2,
      },
      (error, key) => {
        if (error) {
          reject(error)
          return
        }

        resolve(key)
      }
    )
  })
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex")
  const key = await generateKey(password, salt)

  return `${salt}:${key.toString("hex")}`
}

async function seedPermissionsAndRoles() {
  await prisma.rolePermission.deleteMany({
    where: {
      permission: {
        key: { notIn: DEFAULT_PERMISSIONS.map((permission) => permission.key) },
      },
    },
  })
  await prisma.permission.deleteMany({
    where: {
      key: { notIn: DEFAULT_PERMISSIONS.map((permission) => permission.key) },
    },
  })

  for (const permission of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission,
    })
  }

  for (const [roleName, permissionKeys] of Object.entries(
    DEFAULT_ROLE_PERMISSIONS
  )) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {
        slug: generateSlug(roleName),
        isSystem: true,
      },
      create: {
        name: roleName,
        slug: generateSlug(roleName),
        isSystem: true,
      },
    })

    const permissions = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true },
    })

    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      })
    }
  }
}

async function seedPlatformAdmin() {
  const email =
    process.env.SEED_PLATFORM_ADMIN_EMAIL?.trim() || DEFAULT_ADMIN_EMAIL
  const password =
    process.env.SEED_PLATFORM_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD
  const name =
    process.env.SEED_PLATFORM_ADMIN_NAME?.trim() || DEFAULT_ADMIN_NAME

  const platformAdminRole = await prisma.role.findUnique({
    where: { name: PLATFORM_ADMIN_ROLE },
    select: { id: true },
  })

  if (!platformAdminRole) {
    throw new Error("Platform Admin role was not created")
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  const userId = existingUser?.id ?? randomUUID()

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      emailVerified: true,
      roleId: platformAdminRole.id,
    },
    create: {
      id: userId,
      name,
      email,
      emailVerified: true,
      roleId: platformAdminRole.id,
    },
  })

  const passwordHash = await hashPassword(password)

  await prisma.account.upsert({
    where: { id: `${user.id}-credential` },
    update: {
      accountId: user.id,
      providerId: "credential",
      password: passwordHash,
    },
    create: {
      id: `${user.id}-credential`,
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: passwordHash,
    },
  })

  return { email, password, userId: user.id }
}

async function main() {
  await seedPermissionsAndRoles()
  const admin = await seedPlatformAdmin()

  console.log("Platform admin seeded")
  console.log(`Email: ${admin.email}`)
  console.log(`Password: ${admin.password}`)
  console.log(`User ID: ${admin.userId}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
