import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { FastifyReply } from 'fastify';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';

import { User, UserRole } from 'src/users/entities/user.entity';
import { UsersRepository } from 'src/users/users.repository';
import { RefreshTokenRepository } from './refresh-token.repository';
import { TokenService } from './token.service';
import { NotificationService } from 'src/notification/notification.service';
import { RedisService } from 'src/redis/redis.service';
import { RegisterInput } from './graphql/inputs/register.input';
import { LoginInput } from './graphql/inputs/login.input';
import { UserProfile } from './graphql/types/user-profile.type';

import {
  NotificationChannel,
  NotificationType,
} from 'src/notification/enums/notification.enums';
import { generateOtp } from 'src/utils/generate-otp.util';

const REFRESH_TOKEN_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepo: UsersRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly tokenService: TokenService,
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  async login(input: LoginInput, reply: FastifyReply): Promise<UserProfile> {
    const user = await this.userRepo.findByEmail(input.email);

    if (!user) throw new UnauthorizedException('Invalid email or password');

    const passwordMatch = await bcrypt.compare(input.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong password');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const jwtPayload = { id: user.id, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.generateAccessToken(jwtPayload),
      this.tokenService.generateRefreshToken(jwtPayload),
    ]);

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.refreshTokenRepo.save({
      userId: user.id,
      tokenHash,
      expiresAt,
      isRevoked: false,
    });

    this.tokenService.setAuthCookies(reply, accessToken, refreshToken);

    return this.mapper.map(user, User, UserProfile);
  }

  async register(input: RegisterInput): Promise<UserProfile> {
    const existing = await this.userRepo.findByEmail(input.email);

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await this.userRepo.create({
      email: input.email.toLowerCase(),
      password: passwordHash,
      role: UserRole.PASSENGER,
      emailVerified: false,
    });

    const otp = generateOtp(6);

    const otpHash = await bcrypt.hash(otp, 10);
    const key = `auth:email-otp:${user.email}`;

    await this.redisService.set(key, otpHash, 10 * 60);

    try {
      await this.notificationService.send({
        userId: user.id,
        title: 'Email Verification',
        body: `Your email verification code is: ${otp}. It expires in 10 minutes.`,
        type: NotificationType.OTP_CONFIRMATION,
        channels: [NotificationChannel.EMAIL],
        data: { otp, to: user.email },
      });
    } catch (err) {
      this.logger.error(
        `Failed to send email verification OTP to user ${user.id}`,
        err,
      );
    }

    return this.mapper.map(user, User, UserProfile);
  }

  async verifyEmail(email: string, otp: string): Promise<boolean> {
    const key = `auth:email-otp:${email.toLowerCase()}`;
    const storedHash = await this.redisService.get(key);

    if (!storedHash) {
      throw new BadRequestException('OTP expired or not found');
    }

    const isValid = await bcrypt.compare(otp, storedHash);

    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.emailVerified = true;
    await this.userRepo.save(user);
    await this.redisService.del(key);

    return true;
  }

  async refreshToken(
    incomingToken: string,
    reply: FastifyReply,
  ): Promise<UserProfile> {
    let payload: { id: string; role: string };

    try {
      payload = this.tokenService.verifyRefreshToken(incomingToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const storedTokens = await this.refreshTokenRepo.findActiveTokensByUserId(
      payload.id,
    );
    let matchedToken = null;

    for (const stored of storedTokens) {
      if (stored.expiresAt < new Date()) {
        continue;
      }
      const matches = await bcrypt.compare(incomingToken, stored.tokenHash);
      if (matches) {
        matchedToken = stored;
        break;
      }
    }

    if (!matchedToken) {
      await this.refreshTokenRepo.revokeAllForUser(payload.id);
      throw new UnauthorizedException(
        'Refresh token reuse detected. All sessions have been revoked.',
      );
    }

    matchedToken.isRevoked = true;
    await this.refreshTokenRepo.save(matchedToken);

    const user = await this.userRepo.findById(payload.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const jwtPayload = { id: user.id, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.generateAccessToken(jwtPayload),
      this.tokenService.generateRefreshToken(jwtPayload),
    ]);

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.refreshTokenRepo.save({
      userId: user.id,
      tokenHash,
      expiresAt,
      isRevoked: false,
    });

    this.tokenService.setAuthCookies(reply, accessToken, refreshToken);

    return this.mapper.map(user, User, UserProfile);
  }

  async profile(userId: string): Promise<UserProfile> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapper.map(user, User, UserProfile);
  }
}
