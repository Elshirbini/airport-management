import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email.service';
import { MailQueueService } from './mail-queue.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'emails' })],
  providers: [EmailService, MailQueueService],
  exports: [EmailService, MailQueueService],
})
export class EmailModule {}
