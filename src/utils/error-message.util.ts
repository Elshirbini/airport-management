import { HttpException } from '@nestjs/common';
import { GraphQLError } from 'graphql';

export function getErrorMessage(error: GraphQLError): string {
  const originalError = error.originalError;

  if (originalError instanceof HttpException) {
    const response = originalError.getResponse();

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
  }

  return error.message;
}
