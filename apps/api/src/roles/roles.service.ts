import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, EntityType, Prisma, Status } from 'database';
import { generateSlug } from 'src/common/utils/slug.util';
import {
  isUniqueConstraintError,
  isUniqueTargetError,
} from 'src/common/utils/prisma-error.util';
import { clearPermissionCache } from 'src/permissions/permission-cache';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  logger = new Logger(RolesService.name);

  constructor(private readonly db: PrismaService) {}

  private roleAuditValue(role: {
    id: string;
    name: string;
    slug: string | null;
    createdById: string | null;
    isSystem: boolean;
    status: Status;
    deletedAt: Date | null;
    deletedById: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      createdById: role.createdById,
      isSystem: role.isSystem,
      status: role.status,
      deletedAt: role.deletedAt?.toISOString() ?? null,
      deletedById: role.deletedById,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }

  async create(data: CreateRoleDto, userId: string) {
    try {
      const { name, status } = data;
      const slug = generateSlug(name);

      if (!slug) {
        throw new BadRequestException(
          'Role name must contain letters or numbers',
        );
      }

      const createdRole = await this.db.$transaction(async (tx) => {
        const deletedRole = await tx.role.findFirst({
          where: {
            OR: [{ name }, { slug }],
            deletedAt: { not: null },
            isSystem: false,
          },
        });

        if (deletedRole) {
          const restoredRole = await tx.role.update({
            where: { id: deletedRole.id },
            data: {
              name,
              deletedAt: null,
              deletedById: null,
              status: status ?? Status.ACTIVE,
              slug,
              createdById: userId,
            },
            select: {
              id: true,
              name: true,
              slug: true,
              createdById: true,
              createdAt: true,
              updatedAt: true,
              isSystem: true,
              status: true,
              deletedAt: true,
              deletedById: true,
              creator: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          await tx.auditLog.create({
            data: {
              action: AuditAction.RESTORE,
              entityType: EntityType.ROLE,
              entityId: restoredRole.id,
              actorId: userId,
              oldValue: this.roleAuditValue(deletedRole),
              newValue: this.roleAuditValue(restoredRole),
            },
          });

          return restoredRole;
        }

        const role = await tx.role.create({
          data: {
            name,
            slug,
            status,
            createdById: userId,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            createdById: true,
            createdAt: true,
            updatedAt: true,
            isSystem: true,
            status: true,
            deletedAt: true,
            deletedById: true,
            creator: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        await tx.auditLog.create({
          data: {
            action: AuditAction.CREATE,
            entityType: EntityType.ROLE,
            entityId: role.id,
            actorId: userId,
            newValue: this.roleAuditValue(role),
          },
        });

        return role;
      });

      this.logger.log(`Role created: ${createdRole.id} - ${createdRole.name} `);
      return createdRole;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        if (isUniqueTargetError(error, 'slug')) {
          throw new ConflictException(
            'A role with this generated slug already exists',
          );
        }

        throw new ConflictException('A role with this name already exists');
      }

      throw error;
    }
  }

  async update(roleId: string, data: UpdateRoleDto, userId: string) {
    try {
      const { name, status } = data;
      const slug = name ? generateSlug(name) : undefined;

      if (!roleId) {
        throw new BadRequestException('Role ID is required');
      }

      if (name && !slug) {
        throw new BadRequestException(
          'Role name must contain letters or numbers',
        );
      }

      const updatedRole = await this.db.$transaction(async (tx) => {
        const existingRole = await tx.role.findUnique({
          where: {
            id: roleId,
            deletedAt: null,
          },
        });

        if (!existingRole) {
          throw new NotFoundException(
            'No active Role found with the provided Id',
          );
        }

        const updatedRole: Prisma.RoleUpdateInput = {};

        if (existingRole.isSystem) {
          throw new BadRequestException('You cannot update system Roles');
        }

        if (name !== undefined) {
          updatedRole.name = name;
          updatedRole.slug = slug;
        }

        if (status !== undefined) {
          updatedRole.status = status;
        }

        if (Object.keys(updatedRole).length === 0) {
          return existingRole;
        }

        if (
          (name === undefined || name === existingRole.name) &&
          (status === undefined || status === existingRole.status)
        ) {
          return existingRole;
        }

        const newUpdateRole = await tx.role.update({
          where: {
            id: roleId,
          },
          data: updatedRole,
        });

        await tx.auditLog.create({
          data: {
            entityType: EntityType.ROLE,
            entityId: newUpdateRole.id,
            actorId: userId,
            action: AuditAction.UPDATE,
            newValue: this.roleAuditValue(newUpdateRole),
            oldValue: this.roleAuditValue(existingRole),
          },
        });

        return newUpdateRole;
      });

      clearPermissionCache();
      this.logger.log(`Role with ID: ${updatedRole.id} updated`);
      return updatedRole;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        if (isUniqueTargetError(error, 'slug')) {
          throw new ConflictException(
            'A role with this generated slug already exists',
          );
        }

        throw new ConflictException('The Role already exists');
      }

      throw error;
    }
  }

  async list(limit: number = 20, cursor?: { id: string }) {
    const take = Math.min(Math.max(limit, 1), 50);

    const roles = await this.db.role.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isSystem: true,
        status: true,
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        deletedAt: true,
        deletedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take,
      ...(cursor ? { cursor, skip: 1 } : {}),
    });

    const nextCursor =
      roles.length === take ? { id: roles[roles.length - 1].id } : null;

    return {
      roles,
      nextCursor,
    };
  }

  async getBySlug(slug: string) {
    if (!slug) {
      throw new BadRequestException('Role slug is required');
    }

    const role = await this.db.role.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        isSystem: true,
        status: true,
        createdAt: true,
        deletedAt: true,
        permissions: {
          select: {
            permission: {
              select: {
                id: true,
                key: true,
                description: true,
              },
            },
          },
          orderBy: {
            permission: {
              key: 'asc',
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('No role found with the provided slug');
    }

    return role;
  }

  async syncPermissions(
    roleId: string,
    permissionIds: string[],
    userId: string,
  ) {
    if (!roleId) {
      throw new BadRequestException('Role ID is required');
    }

    const uniquePermissionIds = Array.from(new Set(permissionIds));

    const rolePermissions = await this.db.$transaction(async (tx) => {
      const role = await tx.role.findUnique({
        where: { id: roleId, deletedAt: null },
        include: {
          permissions: {
            select: {
              permissionId: true,
            },
          },
        },
      });

      if (!role) {
        throw new NotFoundException(
          'No active role found with the provided ID',
        );
      }

      if (role.isSystem) {
        throw new BadRequestException(
          'You cannot update system Role permissions',
        );
      }

      const permissions = await tx.permission.findMany({
        where: {
          id: {
            in: uniquePermissionIds,
          },
        },
        select: {
          id: true,
        },
      });

      if (permissions.length !== uniquePermissionIds.length) {
        throw new BadRequestException('One or more permissions are invalid');
      }

      await tx.rolePermission.deleteMany({
        where: {
          roleId,
        },
      });

      if (uniquePermissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: uniquePermissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }

      await tx.permissionAuditLog.create({
        data: {
          action: 'role.permissions_updated',
          roleId,
          actorId: userId,
          metadata: {
            previousPermissionIds: role.permissions.map(
              ({ permissionId }) => permissionId,
            ),
            nextPermissionIds: uniquePermissionIds,
          },
        },
      });

      return tx.rolePermission.findMany({
        where: { roleId },
        include: {
          permission: true,
        },
        orderBy: {
          permission: {
            key: 'asc',
          },
        },
      });
    });

    clearPermissionCache();
    return rolePermissions;
  }

  async delete(roleId: string, userId: string) {
    const deletedRole = await this.db.$transaction(async (tx) => {
      const existingRole = await tx.role.findUnique({
        where: { id: roleId, deletedAt: null },
      });

      if (!existingRole) {
        throw new NotFoundException('No role found with the provided ID');
      }

      if (existingRole.isSystem) {
        throw new BadRequestException('Cannot delete system roles');
      }

      const deletedRole = await tx.role.update({
        where: { id: roleId },
        data: {
          deletedAt: new Date(),
          deletedById: userId,
          status: Status.INACTIVE,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: EntityType.ROLE,
          entityId: deletedRole.id,
          actorId: userId,
          action: AuditAction.DELETE,
          newValue: this.roleAuditValue(deletedRole),
          oldValue: this.roleAuditValue(existingRole),
        },
      });

      this.logger.log(`Role with ID:${deletedRole.id} deleted`);

      return deletedRole;
    });

    clearPermissionCache();
    return deletedRole;
  }

  async restore(roleId: string, userId: string) {
    const restoreRole = await this.db.$transaction(async (tx) => {
      const existingRole = await tx.role.findUnique({
        where: { id: roleId, deletedAt: { not: null } },
      });

      if (!existingRole) {
        throw new NotFoundException('No Role found with the provided ID:');
      }

      const restoredRole = await tx.role.update({
        where: {
          id: roleId,
          deletedAt: { not: null },
        },
        data: {
          deletedAt: null,
          deletedById: null,
          status: Status.ACTIVE,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: EntityType.ROLE,
          entityId: existingRole.id,
          actorId: userId,
          action: AuditAction.RESTORE,
          newValue: this.roleAuditValue(restoredRole),
          oldValue: this.roleAuditValue(existingRole),
        },
      });

      return restoredRole;
    });
    clearPermissionCache();
    return restoreRole;
  }
}
