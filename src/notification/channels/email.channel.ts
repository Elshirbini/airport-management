import { Injectable, Logger } from '@nestjs/common';
import { MailQueueService } from '../../email/mail-queue.service';
import { SendNotificationDto } from '../interfaces/notification-channel.interface';

@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);

  constructor(private readonly mailQueueService: MailQueueService) {}

  async send(dto: SendNotificationDto): Promise<void> {
    try {
      await this.mailQueueService.addDataToQueue(dto.type, dto);
      this.logger.debug(`Queued email notification for user ${dto.userId}`);
    } catch (err) {
      this.logger.error(
        `Failed to queue email notification for user ${dto.userId}`,
        err,
      );
    }
  }
}
