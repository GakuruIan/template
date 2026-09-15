import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyCode } from './code.util';

const ACTIVE_TERMINAL_STATUS = 'ACTIVE';

function getCookieValue(cookieHeader: unknown, name: string) {
  if (typeof cookieHeader !== 'string') return undefined;

  const cookies = cookieHeader.split(';');

  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join('='));
    }
  }

  return undefined;
}

@Injectable()
export class TerminalGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token =
      req.cookies?.deviceToken ??
      getCookieValue(req.headers?.cookie, 'deviceToken');

    if (!token) {
      throw new UnauthorizedException(
        'This device is not paired to a terminal',
      );
    }

    const terminalClient = (
      this.prismaService as unknown as {
        terminal: {
          findMany(args: unknown): Promise<
            Array<{
              id: string;
              deviceTokenHash: string | null;
            }>
          >;
          update(args: unknown): Promise<unknown>;
        };
      }
    ).terminal;

    const activeTerminals = await terminalClient.findMany({
      where: {
        status: ACTIVE_TERMINAL_STATUS,
        deviceTokenHash: { not: null },
      },
    });

    let matched: (typeof activeTerminals)[number] | null = null;
    for (const terminal of activeTerminals) {
      if (
        terminal.deviceTokenHash &&
        (await verifyCode(token, terminal.deviceTokenHash))
      ) {
        matched = terminal;
        break;
      }
    }

    if (!matched) {
      throw new UnauthorizedException(
        'This device is not authorized to process sales',
      );
    }

    await terminalClient.update({
      where: { id: matched.id },
      data: { lastSeenAt: new Date(), lastIp: req.ip },
    });

    req.terminal = matched;
    return true;
  }
}
