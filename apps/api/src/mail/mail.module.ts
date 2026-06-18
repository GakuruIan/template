import { Module } from '@nestjs/common';

import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';

import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

import { join } from 'path';
import { existsSync } from 'fs';

import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';


@Module({
  imports: [
    BullModule.registerQueue({ name: 'send-mail' }),
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const host = configService.getOrThrow<string>('MAILTRAP_HOST');
        const port = Number(configService.getOrThrow<string>('MAILTRAP_PORT'));
        const user = configService.getOrThrow<string>('MAILTRAP_USER');
        const pass = configService.getOrThrow<string>('MAILTRAP_PASS');
        const from = configService.getOrThrow<string>('MAILTRAP_FROM');

        const distTemplateDir = join(__dirname, 'templates');
        const srcTemplateDir = join(process.cwd(), 'src', 'mail', 'templates');
        const templateDir = existsSync(distTemplateDir)
          ? distTemplateDir
          : srcTemplateDir;

        return {
          transport: {
            host,
            port,
            secure: false,
            auth: {
              user,
              pass,
            },
          },
          defaults: {
            from,
          },
          template: {
            dir: templateDir,
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [MailProcessor, MailService],
  exports: [MailService, BullModule],
})
export class MailModule {}
