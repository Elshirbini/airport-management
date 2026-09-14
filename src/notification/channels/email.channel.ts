import { Injectable, Logger } from '@nestjs/common';
import { MailQueueService } from '../../email/mail-queue.service';
import { SendNotificationDto } from '../interfaces/notification-channel.interface';
import { EmailJobs } from 'src/email/email.constants';
import { NotificationType } from '../enums/notification.enums';

@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);

  constructor(private readonly mailQueueService: MailQueueService) {}

  async send(dto: SendNotificationDto): Promise<void> {
    try {
      let jobName = '';
      let emailData: any = {};

      switch (dto.type) {
        case NotificationType.OTP_CONFIRMATION:
          jobName = EmailJobs.OTP_CONFIRMATION;
          emailData = {
            to: dto.data?.email,
            otp: dto.data?.otp,
          };
          break;
        case NotificationType.WELCOME:
          jobName = EmailJobs.WELCOME;
          emailData = {
            to: dto.data?.email,
          };
          break;

        default:
          this.logger.warn(
            `Unsupported notification type for email channel: ${dto.type}`,
          );
          return;
      }

      await this.mailQueueService.addDataToQueue(jobName, emailData);
      this.logger.debug(`Queued email notification for user ${dto.userId}`);
    } catch (err) {
      this.logger.error(
        `Failed to queue email notification for user ${dto.userId}`,
        err,
      );
    }
  }
}
