import { Module } from '@nestjs/common';

import { AuthGuard } from './auth.guard';
import { AuthController, AuthSessionController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController, AuthSessionController],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
