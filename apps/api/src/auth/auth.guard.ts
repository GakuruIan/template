import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { auth } from '../auth';
import { AuthenticatedRequest } from './types/auth-session.type';

import { fromNodeHeaders } from 'better-auth/node';
import { PrismaService } from '../prisma/prisma.service';
import { getUserAuthorizationContext } from '../permissions/permission-cache';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) throw new UnauthorizedException('Unauthorized');

    const sessionUser = session.user as typeof session.user & {
      roleId?: string | null;
    };
    const authz = await getUserAuthorizationContext(
      this.prisma,
      sessionUser.id,
      sessionUser.roleId,
    );

    request.session = session;
    request.user = {
      ...sessionUser,
      role: authz.role,
      permissions: authz.permissions,
    };

    return true;
  }
}
