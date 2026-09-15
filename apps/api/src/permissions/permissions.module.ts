import { Global, Module, OnModuleInit } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthSessionService } from './auth-session.service';
import { PermissionsController } from './permissions.controller';
import { PermissionsGuard } from './guards/permissions.guard';
import { PermissionsService } from './permissions.service';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [PermissionsController],
  providers: [
    AuthSessionService,
    PermissionsService,
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
  exports: [AuthSessionService, PermissionsService],
})
export class PermissionsModule implements OnModuleInit {
  constructor(private readonly permissionsService: PermissionsService) {}

  async onModuleInit() {
    await this.permissionsService.seedDefaults();
  }
}
