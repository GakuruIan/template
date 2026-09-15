import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { IncomingHttpHeaders } from 'http';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth';
import { PrismaService } from '../prisma/prisma.service';
import { getUserAuthorizationContext } from './permission-cache';
import type { AuthenticatedRequest } from '../auth/types/auth-session.type';

@Injectable()
export class AuthSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async attachSession(request: AuthenticatedRequest) {
    if (request.user && request.session) {
      return { session: request.session, user: request.user };
    }

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers as IncomingHttpHeaders),
    });

    if (!session) {
      throw new UnauthorizedException('Unauthorized');
    }

    const sessionUser = session.user as typeof session.user & {
      roleId?: string | null;
    };

    const authz = await getUserAuthorizationContext(
      this.prisma,
      sessionUser.id,
      sessionUser.roleId,
    );

    const user = {
      ...sessionUser,
      role: authz.role,
      permissions: authz.permissions,
    };

    request.session = session;
    request.user = user;

    return { session, user };
  }
}
