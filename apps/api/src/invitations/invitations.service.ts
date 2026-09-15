import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { AcceptInvitationDto } from './dto/invitation.dto';
import { hashPassword, hashPin } from 'src/common/utils/password.util';
import { AuditAction, EntityType, InvitationStatus } from 'database';

@Injectable()
export class InvitationsService {
  constructor(private readonly db: PrismaService) {}

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

  async list(branchId?: string) {
    void branchId;
    return [];
  }

  async verify(token: string) {
    const invitation = await this.db.invitation.findUnique({
      where: {
        token,
      },
      select: {
        id: true,
        email: true,
        expiredAt: true,
        role: {
          select: {
            name: true,
          },
        },
        revokedAt: true,
        used: true,
        status: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation Link not found');
    }

    if (invitation?.used) {
      throw new BadRequestException('Invitation link already used');
    }

    if (invitation.revokedAt) {
      throw new BadRequestException('invitation Revoked');
    }

    if (invitation.expiredAt < new Date()) {
      throw new GoneException('Invitation link expired');
    }

    return invitation;
  }

  async acceptInvitation(data: AcceptInvitationDto) {
    const { token, password, pin } = data;
    const invitation = await this.db.invitation.findUnique({
      where: {
        token,
      },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation Link not found');
    }

    if (invitation?.used) {
      throw new BadRequestException('Invitation link already used');
    }

    if (invitation.revokedAt) {
      throw new BadRequestException('invitation Revoked');
    }

    if (invitation.expiredAt < new Date()) {
      throw new GoneException('Invitation link expired');
    }

    if (!password) throw new BadRequestException('Password required');

    const hashedPassword = await hashPassword(password);

    await this.db.$transaction(async (tx) => {
      await tx.account.upsert({
        where: {
          id: `${invitation.userId!}-credential`,
        },
        create: {
          id: `${invitation.userId!}-credential`,
          accountId: invitation.userId!,
          providerId: 'credential',
          userId: invitation.userId!,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: invitation.userId! },
        data: { emailVerified: true },
      });

      const acceptedInvitation = await tx.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          used: true,
          usedAt: new Date(),
          status: InvitationStatus.ACCEPTED,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: EntityType.INVITATION,
          entityId: acceptedInvitation.id,
          actorId: invitation.userId!,
          action: AuditAction.UPDATE,
          oldValue: this.invitationAuditValue(invitation),
          newValue: this.invitationAuditValue(acceptedInvitation),
        },
      });
    });

    return { message: 'Account activated successfully. You can now log in.' };
  }

  async revokeInvitation(
    id: string,
    userId: string,
    branchId?: string,
  ): Promise<void> {
    void branchId;
    const invitation = await this.db.invitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Cannot revoke an invitation with status: ${invitation.status.toLowerCase()}`,
      );
    }

    await this.db.$transaction(async (tx) => {
      const revokedInvitation = await tx.invitation.update({
        where: { id, status: InvitationStatus.PENDING },
        data: {
          revokedAt: new Date(),
          revokedById: userId,
          status: InvitationStatus.REVOKED,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: EntityType.INVITATION,
          entityId: revokedInvitation.id,
          actorId: userId,
          action: AuditAction.UPDATE,
          oldValue: this.invitationAuditValue(invitation),
          newValue: this.invitationAuditValue(revokedInvitation),
        },
      });
    });
  }
}
