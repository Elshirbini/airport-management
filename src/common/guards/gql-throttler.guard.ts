import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();

    return {
      req: ctx.request,
      res: ctx.reply,
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);
    const info = gqlCtx.getInfo();

    // Subscriptions use WebSocket, not HTTP.
    // Don't run the HTTP-based throttler on them.
    if (info.operation.operation === 'subscription') {
      return true;
    }

    // Query / Mutation → use the normal ThrottlerGuard behavior.
    return super.canActivate(context);
  }
}
