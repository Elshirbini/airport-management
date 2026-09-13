import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { FastifyRequest } from 'fastify';

/**
 * GraphQL parameter decorator that extracts the authenticated userId
 * from the Fastify request (set by AuthGuard after JWT verification).
 *
 * Usage: `@CurrentUser() userId: string`
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const gqlCtx = GqlExecutionContext.create(context);
    const { request } = gqlCtx.getContext<{ request: FastifyRequest }>();
    return request.userId!;
  },
);
