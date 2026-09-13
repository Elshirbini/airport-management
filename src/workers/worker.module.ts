import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailModule } from '../email/email.module';
import { MailProcessor } from './processors/email/mail.processor';
import { NotificationModule } from 'src/notification/notification.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { databaseConfig } from 'src/database/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot({
      ...databaseConfig,
      autoLoadEntities: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        return {
          connection: {
            host:
              configService.get<string>('NODE_ENV') === 'prod'
                ? 'redis'
                : configService.getOrThrow<string>('REDIS_HOST'),

            port:
              configService.get<string>('NODE_ENV') === 'prod'
                ? 6379
                : Number(configService.getOrThrow<string>('REDIS_PORT')),

            password:
              configService.get<string>('NODE_ENV') === 'prod'
                ? undefined
                : configService.getOrThrow<string>('REDIS_PASSWORD'),

            enableReadyCheck: true,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: 'emails' }),
    AutomapperModule.forRoot({ strategyInitializer: classes() }),
    NotificationModule,
    EmailModule,
  ],
  providers: [MailProcessor],
})
export class WorkerModule {}
