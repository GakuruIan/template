import { Module } from '@nestjs/common';

import { AuthGuard } from './auth.guard';
import { AuthController } from './auth.controller';

@Module({
  controllers: [AuthController],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
