import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug } from '../common/utils/slug.util';
import {
  isUniqueConstraintError,
  isUniqueTargetError,
} from '../common/utils/prisma-error.util';
import {
  clearPermissionCache,
  clearUserPermissionCache,
} from './permission-cache';
import {
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  isValidPermissionKey,
} from './permissions.constants';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDefaults() {
    await this.prisma.$transaction(async (tx) => {
      for (const permission of DEFAULT_PERMISSIONS) {
        await tx.permission.upsert({
          where: { key: permission.key },
          update: { description: permission.description },
          create: permission,
        });
      }

      for (const [roleName, permissionKeys] of Object.entries(
        DEFAULT_ROLE_PERMISSIONS,
      )) {
        const slug = generateSlug(roleName);
        const role = await tx.role.upsert({
          where: { name: roleName },
          update: { slug, isSystem: true, status: 'ACTIVE', deletedAt: null },
          create: { name: roleName, slug, isSystem: true },
        });

        const permissions = await tx.permission.findMany({
          where: { key: { in: permissionKeys } },
          select: { id: true },
        });

        for (const permission of permissions) {
          await tx.rolePermission.upsert({
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
          });
        }
      }
    });

    clearPermissionCache();
  }

  listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async createPermission(dto: CreatePermissionDto, actorId?: string) {
    if (!isValidPermissionKey(dto.key)) {
      throw new BadRequestException(
        'Permission keys must use the format resource:action',
      );
    }

    try {
      const permission = await this.prisma.permission.create({
        data: {
          key: dto.key,
          description: dto.description,
        },
      });

      await this.audit('permission.created', {
        permissionId: permission.id,
        actorId,
        metadata: { key: permission.key },
      });

      return permission;
    } catch {
      throw new ConflictException('Permission already exists');
    }
  }

  async deletePermission(id: string, actorId?: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    await this.audit('permission.deleted', {
      permissionId: id,
      actorId,
      metadata: { key: permission.key },
    });
    await this.prisma.permission.delete({ where: { id } });
    clearPermissionCache();

    return { deleted: true };
  }

  listRoles() {
    return this.prisma.role.findMany({
      include: {
        _count: {
          select: { users: true, permissions: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createRole(dto: CreateRoleDto, actorId?: string) {
    const slug = generateSlug(dto.name);

    if (!slug) {
      throw new BadRequestException(
        'Role name must contain letters or numbers',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const role = await tx.role.create({
          data: {
            name: dto.name,
            slug,
            isSystem: dto.isSystem ?? false,
          },
        });

        await tx.permissionAuditLog.create({
          data: {
            action: 'role.created',
            roleId: role.id,
            actorId,
            metadata: { name: role.name, slug: role.slug },
          },
        });

        return role;
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        if (isUniqueTargetError(error, 'slug')) {
          throw new ConflictException(
            'A role with this generated slug already exists',
          );
        }

        throw new ConflictException('Role already exists');
      }

      throw error;
    }
  }

  async getRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
          orderBy: { permission: { key: 'asc' } },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async updateRole(id: string, dto: UpdateRoleDto, actorId?: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const data: { name?: string; slug?: string; isSystem?: boolean } = {
      ...dto,
    };

    if (dto.name !== undefined) {
      const slug = generateSlug(dto.name);

      if (!slug) {
        throw new BadRequestException(
          'Role name must contain letters or numbers',
        );
      }

      data.slug = slug;
    }

    try {
      const updatedRole = await this.prisma.role.update({
        where: { id },
        data,
      });

      await this.audit('role.updated', {
        roleId: id,
        actorId,
        metadata: { before: role, after: updatedRole },
      });
      clearPermissionCache();

      return updatedRole;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        if (isUniqueTargetError(error, 'slug')) {
          throw new ConflictException(
            'A role with this generated slug already exists',
          );
        }

        throw new ConflictException('Role already exists');
      }

      throw error;
    }
  }

  async deleteRole(id: string, actorId?: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be deleted');
    }

    await this.audit('role.deleted', {
      roleId: id,
      actorId,
      metadata: { name: role.name },
    });
    await this.prisma.role.delete({ where: { id } });
    clearPermissionCache();

    return { deleted: true };
  }

  async addPermissionToRole(
    roleId: string,
    permissionId: string,
    actorId?: string,
  ) {
    await this.ensureRole(roleId);
    await this.ensurePermission(permissionId);

    const rolePermission = await this.prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId,
        permissionId,
      },
    });

    await this.audit('role.permission_added', {
      roleId,
      permissionId,
      actorId,
    });
    clearPermissionCache();

    return rolePermission;
  }

  async getRolePermissions(roleId: string) {
    await this.ensureRole(roleId);

    return this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
      orderBy: { permission: { key: 'asc' } },
    });
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
    actorId?: string,
  ) {
    await this.ensureRole(roleId);
    await this.ensurePermission(permissionId);

    await this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    await this.audit('role.permission_removed', {
      roleId,
      permissionId,
      actorId,
    });
    clearPermissionCache();

    return { deleted: true };
  }

  async assignUserRole(userId: string, roleId: string, actorId?: string) {
    await this.ensureRole(roleId);

    const previousUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, roleId: true },
    });

    if (!previousUser) {
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { roleId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    await this.audit('user.role_changed', {
      roleId,
      userId,
      actorId,
      metadata: { previousRoleId: previousUser.roleId, nextRoleId: roleId },
    });
    clearUserPermissionCache(userId);

    return user;
  }

  private async ensureRole(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  private async ensurePermission(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  private audit(
    action: string,
    data: {
      roleId?: string;
      permissionId?: string;
      userId?: string;
      actorId?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.prisma.permissionAuditLog.create({
      data: {
        action,
        roleId: data.roleId,
        permissionId: data.permissionId,
        userId: data.userId,
        actorId: data.actorId,
        metadata: data.metadata as never,
      },
    });
  }
}
