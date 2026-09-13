import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { EmailJobs } from 'src/email/email.constants';

@Processor('emails', { concurrency: 5 })
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing email job '${job.name}' with ID ${job.id}`);

    try {
      switch (job.name) {
        case EmailJobs.OTP_CONFIRMATION:
          await this.emailService.sendOTPConfirmationEmail(
            job.data.to,
            job.data.otp,
          );
          break;
        case EmailJobs.WELCOME:
          await this.emailService.sendWelcomeEmail(job.data.to);
          break;
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to process email job '${job.name}'`,
        error.stack,
      );
      throw error;
    }
  }
}
