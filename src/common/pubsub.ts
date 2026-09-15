import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

export const pubSub = new RedisPubSub({
  publisher: new Redis({
    host: process.env.NODE_ENV === 'prod' ? 'redis' : process.env.REDIS_HOST,
    port:
      process.env.NODE_ENV === 'prod' ? 6379 : Number(process.env.REDIS_PORT),
    password:
      process.env.NODE_ENV === 'prod' ? undefined : process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
  }),

  subscriber: new Redis({
    host: process.env.NODE_ENV === 'prod' ? 'redis' : process.env.REDIS_HOST,
    port:
      process.env.NODE_ENV === 'prod' ? 6379 : Number(process.env.REDIS_PORT),
    password:
      process.env.NODE_ENV === 'prod' ? undefined : process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
  }),
});
