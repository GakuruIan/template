import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuditlogsService {
  logger = new Logger(AuditlogsService.name);
  constructor(private readonly db: PrismaService) {}

  async list(limit: number = 20, cursor?: { id: string }) {
    const take = Math.min(Math.max(limit, 1), 30);

    const logs = await this.db.auditLog.findMany({
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        actor: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        oldValue: true,
        newValue: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      ...(cursor
        ? {
            cursor: { id: cursor.id },
            skip: 1,
          }
        : {}),
    });

    const nextCursor =
      logs.length === take ? { id: logs[logs.length - 1].id } : undefined;

    return { logs, nextCursor };
  }
}
