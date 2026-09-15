import { WorkerHost, Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from './mail.service';

import { EmailData, SendVerificationEmailData, UserData } from './types/mail';

@Processor('send-mail')
export class MailProcessor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'send-verification-email':
        await this.sendVerificationEmail(job.data);
        break;
      case 'send-password-reset-email':
        await this.sendPasswordResetEmail(job.data);
        break;
      case 'send-password-reset-success-email':
        await this.sendPasswordResetSuccessEmail(job.data);
        break;

      case 'send-invitation-email':
        await this.sendInvitationEmail(job.data);
        break;
      default:
        break;
    }
  }

  private async sendVerificationEmail(data: SendVerificationEmailData) {
    await this.mailService.sendVerificationEmail(
      data.username,
      data.email,
      data.code,
    );
  }

  private async sendPasswordResetEmail(data: EmailData) {
    await this.mailService.sendPasswordResetEmail(
      data.username,
      data.email,
      data.code,
    );
  }

  private async sendPasswordResetSuccessEmail(data: EmailData) {
    await this.mailService.sendPasswordResetSuccessEmail(
      data.username,
      data.email,
    );
  }

  private async sendInvitationEmail(data: UserData) {
    await this.mailService.sendInvitationEmail(
      data.name,
      data.email,
      data.role,
      data.frontend_url,
      data.employeeCode,
    );
  }
}
