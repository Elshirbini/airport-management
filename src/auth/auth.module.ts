import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthMapper } from './auth.mapper';

import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokenRepository } from './refresh-token.repository';
import { UsersModule } from 'src/users/users.module';
import { NotificationModule } from 'src/notification/notification.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken]),
    NotificationModule,
    RedisModule,
  ],
  providers: [
    AuthResolver,
    AuthService,
    TokenService,
    RefreshTokenRepository,
    AuthMapper,
  ],
})
export class AuthModule {}
