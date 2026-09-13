import type { ApolloServerPlugin } from '@apollo/server';
import { HttpException, Logger } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

interface GraphQLContext {
  request: FastifyRequest;
  reply: FastifyReply;
}

function getErrorMessage(error: Error): string {
  if (!(error instanceof HttpException)) {
    return error.message;
  }

  const response = error.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  if (
    typeof response === 'object' &&
    response !== null &&
    'message' in response
  ) {
    const message = response.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  return error.message;
}

export const GraphQLLoggingPlugin: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart() {
    const logger = new Logger('GraphQLLoggingPlugin');
    const start = Date.now();

    return {
      async didEncounterErrors({ errors, request, contextValue }) {
        const { request: httpRequest, reply } = contextValue;

        for (const error of errors) {
          logger.error({
            type: 'graphql_error',
            message: getErrorMessage(error.originalError ?? error),
            code: error.extensions?.code ?? null,
            path: error.path ?? null,
            operationName: request.operationName ?? 'anonymous',
            method: httpRequest.method,
            url: httpRequest.url,
            statusCode: reply.statusCode,
            durationMs: Date.now() - start,
            requestId:
              httpRequest.id ?? httpRequest.headers['x-request-id'] ?? null,
            userId: httpRequest.userId ?? null,
          });
        }
      },

      async willSendResponse({
        request: apolloRequest,
        response,
        contextValue,
      }) {
        const { request: httpRequest, reply } = contextValue;

        const errors =
          response.body.kind === 'single'
            ? (response.body.singleResult.errors?.map((error) => ({
                message: error.message,
                code: error.extensions?.code ?? null,
                path: error.path ?? null,
              })) ?? [])
            : [];

        logger.log({
          type: 'graphql_request',
          method: httpRequest.method,
          url: httpRequest.url,
          statusCode: reply.statusCode,
          durationMs: Date.now() - start,
          ip: httpRequest.ip ?? httpRequest.headers['x-forwarded-for'] ?? null,
          userAgent: httpRequest.headers['user-agent'] ?? null,
          requestId:
            httpRequest.id ?? httpRequest.headers['x-request-id'] ?? null,
          userId: httpRequest.userId ?? null,
          operationName: apolloRequest.operationName ?? 'anonymous',
          errors,
        });
      },
    };
  },
};
