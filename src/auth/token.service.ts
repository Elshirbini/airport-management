import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { FastifyReply } from 'fastify';
import { jwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private readonly cookiesOptionAccessToken = {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as 'lax' | 'strict' | 'none',
    path: '/',
    maxAge: 15 * 60, // 15 minutes
  };

  private readonly cookiesOptionRefreshToken = {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as 'lax' | 'strict' | 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  };

  generateAccessToken(payload: jwtPayload): Promise<string> {
    return this.jwtService.signAsync(
      { id: payload.id, role: payload.role },
      {
        secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: this.config.get<string>(
          'ACCESS_TOKEN_EXPIRES_IN',
        ) as StringValue,
      },
    );
  }

  generateRefreshToken(payload: jwtPayload): Promise<string> {
    return this.jwtService.signAsync(
      { id: payload.id, role: payload.role },
      {
        secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: this.config.get<string>(
          'REFRESH_TOKEN_EXPIRES_IN',
        ) as StringValue,
      },
    );
  }

  verifyRefreshToken(token: string): jwtPayload {
    return this.jwtService.verify<jwtPayload>(token, {
      secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
    });
  }

  setAuthCookies(res: FastifyReply, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, this.cookiesOptionAccessToken);
    res.cookie('refreshToken', refreshToken, this.cookiesOptionRefreshToken);
  }

  clearAuthCookies(res: FastifyReply) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }
}
