import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, tap } from 'rxjs';

@Injectable()
export class GraphQLResolverTimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('GraphQLResolver');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const gqlContext = GqlExecutionContext.create(context);

    const info = gqlContext.getInfo();

    const start = performance.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = performance.now() - start;

          this.logger.log(
            `${info.parentType.name}.${info.fieldName} - ${duration.toFixed(2)}ms`,
          );
        },

        error: (error) => {
          const duration = performance.now() - start;

          this.logger.error(
            `${info.parentType.name}.${info.fieldName} - ${duration.toFixed(2)}ms - ERROR`,
          );
        },
      }),
    );
  }
}
