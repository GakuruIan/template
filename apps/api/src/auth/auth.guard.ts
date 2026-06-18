import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { auth } from '../auth';
import { AuthenticatedRequest } from './types/auth-session.type';

import { fromNodeHeaders } from 'better-auth/node';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) throw new UnauthorizedException('Unauthorized');

    request.session = session;
    request.user = session.user;

    return true;
  }
}
