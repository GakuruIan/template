import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditAction, EntityType, Prisma } from 'database';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import {
  isUniqueConstraintError,
  isUniqueTargetError,
} from 'src/common/utils/prisma-error.util';

import { addMinutes } from 'date-fns';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UserData } from 'src/mail/types/mail';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly db: PrismaService,
    @InjectQueue('send-mail') private readonly mailQueue: Queue<UserData>,
  ) {}

  private invitationAuditValue(invitation: {
    id: string;
    email: string;
    status: string;
    expiredAt: Date;
    used: boolean;
    usedAt: Date | null;
    invitedById: string | null;
    roleId: string | null;
    revokedById: string | null;
    userId: string | null;
    revokedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: invitation.id,
      email: invitation.email,
      status: invitation.status,
      expiredAt: invitation.expiredAt.toISOString(),
      used: invitation.used,
      usedAt: invitation.usedAt?.toISOString() ?? null,
      invitedById: invitation.invitedById,
      roleId: invitation.roleId,
      revokedById: invitation.revokedById,
      userId: invitation.userId,
      revokedAt: invitation.revokedAt?.toISOString() ?? null,
      createdAt: invitation.createdAt.toISOString(),
      updatedAt: invitation.updatedAt.toISOString(),
    };
  }

  private userAuditValue(user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    phoneNumber: string | null;
    employeeCode: string | null;
    roleId: string | null;
    role: { id: string; name: string } | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
      employeeCode: user.employeeCode,
      roleId: user.roleId,
      role: user.role
        ? {
            id: user.role.id,
            name: user.role.name,
          }
        : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private formatEmployeeCode(sequence: number) {
    return `EMP-${String(sequence).padStart(4, '0')}`;
  }

  private readonly userSelect = {
    id: true,
    name: true,
    email: true,
    emailVerified: true,
    phoneNumber: true,
    employeeCode: true,
    roleId: true,
    role: {
      select: {
        id: true,
        name: true,
      },
    },
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.UserSelect;

  private async generateEmployeeCode(
    db: Prisma.TransactionClient | PrismaService = this.db,
  ): Promise<string> {
    const existingUsers = await db.user.findMany({
      where: {
        employeeCode: {
          startsWith: 'EMP-',
        },
      },
      select: {
        employeeCode: true,
      },
    });

    const usedSequences = new Set(
      existingUsers
        .map((user) => user.employeeCode?.match(/^EMP-(\d+)$/)?.[1])
        .filter((sequence): sequence is string => Boolean(sequence))
        .map((sequence) => Number.parseInt(sequence, 10)),
    );

    let nextSequence = 1;
    while (usedSequences.has(nextSequence)) {
      nextSequence++;
    }

    return this.formatEmployeeCode(nextSequence);
  }

  async createUser(data: CreateUserDto, userId: string) {
    const expiredAt = addMinutes(new Date(), 15);

    const result = await this.db.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: {
          email: data.email,
        },
      });

      if (existingUser) {
        throw new ConflictException('Employee already exists');
      }

      const role = data.roleId
        ? await tx.role.findUnique({
            where: {
              id: data.roleId,
            },
            select: {
              id: true,
              name: true,
            },
          })
        : data.roleName
          ? await tx.role.findUnique({
              where: {
                name: data.roleName,
              },
              select: {
                id: true,
                name: true,
              },
            })
          : undefined;

      if (!role) {
        throw data.roleId || data.roleName
          ? new NotFoundException('Role not found')
          : new BadRequestException('Role is required');
      }

      const user = await tx.user.create({
        data: {
          id: randomUUID(),
          email: data.email,
          name: data.name,
          roleId: role.id,
          employeeCode: await this.generateEmployeeCode(tx),
          phoneNumber: data.phoneNumber,
        },
      });

      const token = randomUUID();

      const invitation = await tx.invitation.create({
        data: {
          email: user.email,
          token,
          roleId: role.id,
          expiredAt,
          invitedById: userId,
          userId: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: EntityType.INVITATION,
          entityId: invitation.id,
          actorId: userId,
          action: AuditAction.CREATE,
          newValue: this.invitationAuditValue(invitation),
        },
      });

      return {
        user,
        invitation,
        roleName: role.name,
      };
    });

    const { email, employeeCode, name } = result.user;

    const frontendUrl = this.buildInvitationUrl(result.invitation.token);

    await this.mailQueue.add('send-invitation-email', {
      name,
      email,
      role: result.roleName,
      frontend_url: frontendUrl,
      employeeCode,
    });

    this.logger.log(
      `Invitation email sent to ${email} for user ${name} with role ${result.roleName}`,
    );

    return result.user;
  }

  async updateUser(userId: string, data: UpdateUserDto, actorId: string) {
    const updateData: Prisma.UserUpdateInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.email !== undefined) {
      updateData.email = data.email;
    }

    if (data.phoneNumber !== undefined) {
      updateData.phoneNumber = data.phoneNumber;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No user fields provided for update');
    }

    try {
      return await this.db.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: { id: userId },
          select: this.userSelect,
        });

        if (!existingUser) {
          throw new NotFoundException('User not found');
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: updateData,
          select: this.userSelect,
        });

        await tx.auditLog.create({
          data: {
            entityType: EntityType.USER,
            entityId: userId,
            actorId,
            action: AuditAction.UPDATE,
            oldValue: this.userAuditValue(existingUser),
            newValue: this.userAuditValue(updatedUser),
          },
        });

        return updatedUser;
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        if (isUniqueTargetError(error, 'email')) {
          throw new ConflictException('A user with this email already exists');
        }

        throw new ConflictException('User already exists');
      }

      throw error;
    }
  }

  async listUsers(
    roleName?: string,
    excludeRoleName?: string,
    cursor?: { id: string },
    limit: number = 20,
  ) {
    const take = Math.min(Math.max(limit, 1), 50);

    const users = await this.db.user.findMany({
      where: {
        ...(roleName && {
          role: {
            name: { equals: roleName, mode: 'insensitive' },
          },
        }),
        ...(excludeRoleName && {
          NOT: {
            role: {
              name: { equals: excludeRoleName, mode: 'insensitive' },
            },
          },
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        phoneNumber: true,
        employeeCode: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...(cursor
        ? {
            cursor: { id: cursor?.id },
            skip: 1,
          }
        : {}),
      take,
    });

    const nextCursor =
      users.length === take
        ? {
            id: users[users.length - 1].id,
          }
        : undefined;

    return {
      users,
      nextCursor,
    };
  }

  async listUserOptions(
    roleName?: string,
    search?: string,
    limit: number = 20,
  ) {
    const take = Math.min(Math.max(limit, 1), 50);

    return this.db.user.findMany({
      where: {
        ...(roleName && {
          role: {
            name: { equals: roleName, mode: 'insensitive' },
          },
        }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: { name: true },
        },
      },
      orderBy: { name: 'asc' },
      take,
    });
  }

  private buildInvitationUrl(token: string) {
    const frontendUrl = process.env.FRONTEND_URL ?? process.env.APP_URL;

    if (!frontendUrl) {
      return '';
    }

    return `${frontendUrl.replace(/\/$/, '')}/invitations/accept?token=${token}`;
  }
}
