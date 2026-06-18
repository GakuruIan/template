import { Controller, All, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { toNodeHandler } from 'better-auth/node';

import { auth } from '../auth';

const authHandler = toNodeHandler(auth);

@Controller('api/auth')
export class AuthController {
  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    return authHandler(req, res);
  }
}
