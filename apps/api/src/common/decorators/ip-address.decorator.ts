import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IpExtractor } from '../utils/ip-extractor';

export const IpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return IpExtractor.getClientIp(request);
  },
);

export const IpInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return IpExtractor.getIpInfo(request);
  },
);
