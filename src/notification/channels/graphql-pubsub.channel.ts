import { Injectable, Logger } from '@nestjs/common';
import { pubSub } from '../pubsub';
// import { Notification } from '../schemas/notification.schema';

@Injectable()
export class GraphQLPubSubChannel {
  private readonly logger = new Logger(GraphQLPubSubChannel.name);

  async send(notification: any): Promise<void> {
    try {
      await pubSub.publish('NOTIFICATION_CREATED', {
        notificationCreated: notification,
      });

      this.logger.debug(
        `Published NOTIFICATION_CREATED for userId=${String(notification?.userId)}`,
      );
    } catch (err: unknown) {
      this.logger.error('GraphQLPubSubChannel failed to publish', err);
    }
  }
}
