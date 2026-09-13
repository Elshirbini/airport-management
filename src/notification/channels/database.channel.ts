import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../notification.repository';
import { SendNotificationDto } from '../interfaces/notification-channel.interface';
import { NotificationChannel } from '../enums/notification.enums';

@Injectable()
export class DatabaseChannel {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async send(dto: SendNotificationDto) {
    return this.notificationRepo.createNotification({
      userId: dto.userId,
      subject: dto.title,
      message: dto.body,
      type: dto.type,
      channel: NotificationChannel.DATABASE,
    });
  }
}
