import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';

import { auth } from './auth';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';

import { CloudinaryService } from './cloudinary/cloudinary.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { AuditlogsModule } from './auditlogs/auditlogs.module';
import { InvitationsModule } from './invitations/invitations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    PrismaModule,
    BetterAuthModule.forRoot({
      auth,
    }),
    MailModule,
    AuthModule,
    CloudinaryModule,
    UsersModule,
    PermissionsModule,
    RolesModule,
    AuditlogsModule,
    InvitationsModule,
  ],
  controllers: [],
  providers: [MailService, CloudinaryService],
})
export class AppModule {}
