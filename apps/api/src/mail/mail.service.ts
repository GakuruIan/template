import { Injectable, Logger } from '@nestjs/common';

// services
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config/dist/config.service';

// helpers
import {
  formatCurrency,
  formatDate,
  toNumber,
} from '../common/utils/helpers.util';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendWelcomeEmail(name: string, email: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to MarketSquare',
        template: './welcome-email',
        context: {
          name,
        },
      });

      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
      throw error;
    }
  }

  async sendVerificationEmail(
    name: string,
    email: string,
    verificationCode: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify your email',
        template: './email-verification',
        context: {
          name,
          verificationCode,
          year: new Date().getFullYear(),
          expiryMinutes: 15,
          // frontendUrl: this.configService.get<string>('FRONTEND_URL'),
        },
      });

      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(
    name: string,
    email: string,
    verificationCode: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset your password',
        template: './password-reset',
        context: {
          name,
          resetCode: verificationCode,
          year: new Date().getFullYear(),
          expiryMinutes: 15,
          // frontendUrl: this.configService.get<string>('FRONTEND_URL'),
        },
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error,
      );
      throw error;
    }
  }

  async sendPasswordResetSuccessEmail(name: string, email: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your password has been reset successfully',
        template: './password-reset-success-email',
        context: {
          name,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Password reset success email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset success email to ${email}`,
        error,
      );
      throw error;
    }
  }

  async sendInvitationEmail(
    name: string,
    email: string,
    role: string,
    frontend_url: string,
    employeeCode?: string | null,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your have been invited to Reveal Pos',
        template: './invitation-email',
        context: {
          name,
          role,
          employeeCode,
          year: new Date().getFullYear(),
          invitation_link: frontend_url,
        },
      });
      this.logger.log(`Invitation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${email}`, error);
      throw error;
    }
  }
}
