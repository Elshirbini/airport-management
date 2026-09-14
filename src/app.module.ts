import { HttpException, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import depthLimit from 'graphql-depth-limit';
import { RedisModule } from './redis/redis.module';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Redis } from 'ioredis';
import { APP_GUARD } from '@nestjs/core';
import { GracefulShutdownService } from './common/graceful-shutdown.service';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';
import { GraphQLLoggingPlugin } from './common/plugins/graphqlLogging.plugin';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { GraphQLError } from 'graphql';
import { NotificationModule } from './notification/notification.module';
import { jwtPayload } from './common/interfaces/jwt-payload.interface';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ComplexityPlugin } from './common/plugins/complexity.plugin';
import { databaseConfig } from './database/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AirportModule } from './airports/airport.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StaffModule } from './staff/staff.module';
import { AirportAdminsModule } from './airport-admins/airport-admins.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      ...databaseConfig,
      autoLoadEntities: true,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService, JwtService],
      useFactory: (configService: ConfigService, jwtService: JwtService) => ({
        playground: false,
        allowBatchedHttpRequests: process.env.NODE_ENV === 'dev',
        introspection: true,
        persistedQueries: {},
        autoSchemaFile: join(process.cwd(), 'src', 'graphql', 'schema.gql'),
        validationRules: [depthLimit(10)], // 10 depth max limit
        subscriptions: {
          'graphql-ws': {
            onConnect: async (ctx) => {
              const authorization = ctx.connectionParams?.authorization;

              if (
                typeof authorization !== 'string' ||
                !authorization.startsWith('Bearer ')
              ) {
                throw new Error('Unauthorized');
              }

              const token = authorization.slice(7);

              try {
                const payload = await jwtService.verifyAsync<jwtPayload>(
                  token,
                  {
                    secret: process.env.ACCESS_TOKEN_SECRET,
                  },
                );

                return {
                  user: payload,
                };
              } catch {
                throw new Error('Unauthorized');
              }
            },
          },
        },

        formatError: (formattedError, error) => {
          const originalError =
            error instanceof GraphQLError ? error.originalError : undefined;

          let message = formattedError.message;

          if (originalError instanceof HttpException) {
            const response = originalError.getResponse();

            if (
              typeof response === 'object' &&
              response !== null &&
              'message' in response
            ) {
              const validationMessage = response.message;

              if (Array.isArray(validationMessage)) {
                message = validationMessage.join(', ');
              } else if (typeof validationMessage === 'string') {
                message = validationMessage;
              }
            }
          }

          return {
            message,
            path: formattedError.path,
            extensions: {
              code: formattedError.extensions?.code,
            },
          };
        },
        context: (request: FastifyRequest, reply: FastifyReply) => ({
          request,
          reply,
        }),
        plugins: [
          GraphQLLoggingPlugin,
          ApolloServerPluginLandingPageLocalDefault(),
        ],
      }),
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const redis = new Redis({
          host:
            configService.get('NODE_ENV') === 'prod'
              ? 'redis'
              : configService.get<string>('REDIS_HOST'),

          port:
            configService.get('NODE_ENV') === 'prod'
              ? 6379
              : Number(configService.get('REDIS_PORT')),

          password:
            configService.get('NODE_ENV') === 'prod'
              ? undefined
              : configService.get<string>('REDIS_PASSWORD'),
        });

        return {
          throttlers: [
            {
              ttl: 1 * 60 * 1000,
              limit: 3000,
            },
          ],

          storage: new ThrottlerStorageRedisService(redis),
        };
      },
    }),
    AutomapperModule.forRoot({ strategyInitializer: classes() }),
    RedisModule,
    NotificationModule,
    AirportModule,
    UsersModule,
    JwtModule.register({ global: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host:
            configService.get('NODE_ENV') === 'prod'
              ? 'redis'
              : configService.get<string>('REDIS_HOST'),
          port:
            configService.get('NODE_ENV') === 'prod'
              ? 6379
              : Number(configService.get('REDIS_PORT')),
          password:
            configService.get('NODE_ENV') === 'prod'
              ? undefined
              : configService.get<string>('REDIS_PASSWORD'),
          enableReadyCheck: true,
        },
      }),
    }),
    AuthModule,
    StaffModule,
    AirportAdminsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: GqlThrottlerGuard },
    ComplexityPlugin,
    GracefulShutdownService,
  ],
})
export class AppModule {}
