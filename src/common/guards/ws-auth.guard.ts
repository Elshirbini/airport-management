import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { jwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context).getContext();

    // First, try to see if app.module onConnect already populated extra.user
    if (ctx.extra && ctx.extra.user) {
      ctx.user = ctx.extra.user;
      return true;
    }

    // Otherwise, try to extract token from connectionParams
    const authorization = ctx.connectionParams?.authorization;
    if (
      typeof authorization !== 'string' ||
      !authorization.startsWith('Bearer ')
    ) {
      throw new UnauthorizedException('Unauthorized');
    }

    const token = authorization.slice(7);
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });

      ctx.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token is invalid or expired');
    }
  }
}
