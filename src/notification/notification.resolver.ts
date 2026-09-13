import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { QueryInput } from './graphql/inputs/query.input';
import {
  Args,
  Context,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { GraphQLContext } from 'src/graphql/graphql-context';
import { NotificationResponse } from './graphql/types/notification-response.type';
import { Notification } from './graphql/types/notification.type';
import { pubSub } from './pubsub';
import { SubscriptionAuthGuard } from 'src/common/guards/subscription-auth.guard';

@Resolver()
export class NotificationResolver {
  constructor(private notificationService: NotificationService) {}

  @UseGuards(AuthGuard)
  @Query(() => NotificationResponse)
  getNotifications(
    @Context() ctx: GraphQLContext,
    @Args('input') query: QueryInput,
  ) {
    return this.notificationService.getNotifications(ctx, query);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Notification)
  markAsRead(@Context() ctx: GraphQLContext, @Args('id') id: string) {
    return this.notificationService.markAsRead(ctx, id);
  }

  @UseGuards(SubscriptionAuthGuard)
  @Subscription(() => Notification, {
    name: 'notificationCreated',
  })
  notificationCreated(@Context() context: GraphQLContext) {
    return pubSub.asyncIterableIterator('NOTIFICATION_CREATED');
  }
}
