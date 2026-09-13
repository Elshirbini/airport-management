import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLContext } from 'src/graphql/graphql-context';

@Injectable()
export class SubscriptionAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const gqlContext =
      GqlExecutionContext.create(context).getContext<GraphQLContext>();

    if (!gqlContext.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return true;
  }
}
