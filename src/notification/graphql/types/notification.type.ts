import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  NotificationType,
  NotificationChannel,
} from '../../enums/notification.enums';

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

registerEnumType(NotificationType, {
  name: 'NotificationType',
});

registerEnumType(NotificationChannel, {
  name: 'NotificationChannel',
});

registerEnumType(NotificationStatus, {
  name: 'NotificationStatus',
});

@ObjectType()
export class Notification {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => ID, { nullable: true })
  bookingId?: string;

  @Field(() => ID, { nullable: true })
  flightId?: string;

  @Field(() => NotificationType)
  type!: NotificationType;

  @Field(() => NotificationChannel)
  channel!: NotificationChannel;

  @Field(() => NotificationStatus)
  status!: NotificationStatus;

  @Field({ nullable: true })
  subject?: string;

  @Field()
  message!: string;

  @Field()
  isRead!: boolean;

  @Field({ nullable: true })
  readAt?: Date;

  @Field({ nullable: true })
  sentAt?: Date;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
