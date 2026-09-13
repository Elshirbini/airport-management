import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';

import { jwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);

    const { request } = gqlContext.getContext<{
      request: FastifyRequest;
    }>();

    const token = request.cookies?.accessToken;

    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }

    try {
      const payload = await this.jwtService.verifyAsync<jwtPayload>(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });

      request.userId = payload.id;
      request.userRole = payload.role;

      return true;
    } catch {
      throw new UnauthorizedException('Token is invalid or expired');
    }
  }
}
