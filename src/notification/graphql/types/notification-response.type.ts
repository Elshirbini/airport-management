import { Field, ObjectType } from '@nestjs/graphql';
import { Notification } from './notification.type';

@ObjectType()
class NotificationMeta {
  @Field()
  totalCount!: number;
}

@ObjectType()
export class NotificationResponse {
  @Field(() => [Notification])
  notifications!: Notification[];

  @Field(() => NotificationMeta)
  meta!: NotificationMeta;
}
