import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { resolvePagination } from '../common/utils/pagination.util';
import { Notification } from './entities/notification.entity';
import { QueryInput } from './graphql/inputs/query.input';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(
    notificationData: Partial<Notification>,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create(notificationData);

    return this.notificationRepository.save(notification);
  }

  async getNotificationsByUserId(
    userId: string,
    query: QueryInput,
  ): Promise<{
    notifications: Notification[];
    page: number;
    totalCount: number;
  }> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const [notifications, totalCount] =
      await this.notificationRepository.findAndCount({
        where: {
          userId,
          ...(query.is_read !== undefined && {
            isRead: query.is_read,
          }),
        },
        order: {
          createdAt: 'DESC',
        },
        skip,
        take: limit,
      });

    return {
      notifications,
      page,
      totalCount,
    };
  }

  async findNotificationByIdAndUserId(
    notificationId: string,
    userId: string,
  ): Promise<Notification | null> {
    return this.notificationRepository.findOne({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  async saveNotification(notification: Notification): Promise<Notification> {
    return this.notificationRepository.save(notification);
  }
}
