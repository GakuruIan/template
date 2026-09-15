import {
  All,
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { IncomingHttpHeaders } from 'http';

import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';

import { auth } from '../auth';
import { PrismaService } from '../prisma/prisma.service';
import { getUserAuthorizationContext } from '../permissions/permission-cache';

const authHandler = toNodeHandler(auth);

@Controller('api/auth')
export class AuthController {
  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    return authHandler(req, res);
  }
}

@Controller('auth')
export class AuthSessionController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('session')
  async getSession(@Req() req: Request) {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
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

    return {
      session: session.session,
      user: {
        ...sessionUser,
        role: authz.role,
        permissions: authz.permissions,
      },
    };
  }
}
