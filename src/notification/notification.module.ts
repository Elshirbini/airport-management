import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../email/email.module';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { Notification } from './entities/notification.entity';

import { DatabaseChannel } from './channels/database.channel';
import { GraphQLPubSubChannel } from './channels/graphql-pubsub.channel';
import { EmailChannel } from './channels/email.channel';
import { NotificationMapper } from './mappers/notification.mapper';
import { NotificationResolver } from './notification.resolver';

@Module({
  imports: [JwtModule, EmailModule, TypeOrmModule.forFeature([Notification])],
  providers: [
    NotificationResolver,
    NotificationService,
    NotificationRepository,
    DatabaseChannel,
    GraphQLPubSubChannel,
    EmailChannel,
    NotificationMapper,
  ],
  exports: [NotificationService, NotificationRepository],
})
export class NotificationModule {}
