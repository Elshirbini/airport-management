import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { QueryInput } from './graphql/inputs/query.input';
import { DatabaseChannel } from './channels/database.channel';
import { GraphQLPubSubChannel } from './channels/graphql-pubsub.channel';
import { EmailChannel } from './channels/email.channel';
import { Notification as DBNotification } from './entities/notification.entity';
import { SendNotificationDto } from './interfaces/notification-channel.interface';
import { NotificationChannel } from './enums/notification.enums';
import { GraphQLContext } from 'src/graphql/graphql-context';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Notification as GraphQLNotification } from './graphql/types/notification.type';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly databaseChannel: DatabaseChannel,
    private readonly graphqlPubSubChannel: GraphQLPubSubChannel,
    private readonly emailChannel: EmailChannel,
    @InjectMapper()
    private readonly mapper: Mapper,
  ) {}

  async send(dto: SendNotificationDto): Promise<void> {
    let savedNotification: any = null;

    if (dto.channels.includes(NotificationChannel.DATABASE)) {
      try {
        savedNotification = await this.databaseChannel.send(dto);
      } catch (err: unknown) {
        this.logger.error(`DatabaseChannel failed for user ${dto.userId}`, err);
      }
    }

    if (dto.channels.includes(NotificationChannel.GRAPHQL_PUBSUB)) {
      await this.graphqlPubSubChannel.send(savedNotification ?? dto);
    }

    if (dto.channels.includes(NotificationChannel.EMAIL)) {
      await this.emailChannel.send(dto);
    }
  }

  async getNotifications(ctx: GraphQLContext, query: QueryInput) {
    const userId = ctx.request.userId!;
    const { notifications, page, totalCount } =
      await this.notificationRepo.getNotificationsByUserId(userId, query);

    const mappedNotifications = this.mapper.mapArray(
      notifications,
      DBNotification,
      GraphQLNotification,
    );

    return { notifications: mappedNotifications, meta: { page, totalCount } };
  }

  async markAsRead(ctx: GraphQLContext, notificationId: string) {
    const userId = ctx.request.userId!;

    const notification =
      await this.notificationRepo.findNotificationByIdAndUserId(
        notificationId,
        userId,
      );
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();

    await this.notificationRepo.saveNotification(notification);

    return this.mapper.map(notification, DBNotification, GraphQLNotification);
  }
}
