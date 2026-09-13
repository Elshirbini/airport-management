import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MailQueueService {
  private readonly logger = new Logger(MailQueueService.name);

  constructor(@InjectQueue('emails') private readonly emailQueue: Queue) {}

  /**
   * Add an email job to the global email queue.
   * @param jobName The name of the email template/job to execute.
   * @param data The data required for the email template.
   */
  async addDataToQueue(jobName: string, data: any, delayMs?: number) {
    try {
      await this.emailQueue.add(jobName, data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
        ...(delayMs !== undefined && delayMs > 0 ? { delay: delayMs } : {}),
      });
      this.logger.log(`Added email job '${jobName}' to queue 'emails'`);
    } catch (error: any) {
      this.logger.error(
        `Failed to add email job '${jobName}' to queue`,
        error.stack,
      );
      throw error;
    }
  }
}
