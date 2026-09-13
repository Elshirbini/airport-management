/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// import 'module-alias/register';
import { config } from 'dotenv';
config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyCompress from '@fastify/compress';
import { winstonLogger } from './common/winston-logger';
import * as crypto from 'crypto';
import blockedAt from 'blocked-at';
import { GraphQLValidationPipe } from './common/pipes/graphql-validation.pipe';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { createHandler } from 'graphql-sse/lib/use/fastify';
import { JwtService } from '@nestjs/jwt';
import { jwtPayload } from './common/interfaces/jwt-payload.interface';
import { UnauthorizedException } from '@nestjs/common';

type BlockedAtFn = (
  onBlock: (time: number, stack: unknown) => void,
  options?: { threshold?: number },
) => void;

async function bootstrap() {
  (blockedAt as unknown as BlockedAtFn)(
    (time, stack) => {
      winstonLogger.log(`BLOCKED FOR ${time}ms`);
      winstonLogger.log(stack);
    },
    { threshold: 1000 },
  );
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true, bodyLimit: 10 * 1024 * 1024 }),
    {
      logger: winstonLogger,
    },
  );

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://studio.apollographql.com',
      'https://sandbox.embed.apollographql.com',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    credentials: true,
  });

  await app.register(fastifyCompress, {
    global: true,
  });

  const fastify = app.getHttpAdapter().getInstance();

  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onRequest', (req: any, res: any, next) => {
      const requestId = crypto.randomUUID();

      req.requestId = requestId;

      res.setHeader = (key: string, value: string) => {
        return res.raw.setHeader(key, value);
      };
      res.end = (data?: any) => {
        res.raw.end(data);
      };
      req.res = res;

      res.raw.setHeader('x-request-id', requestId);

      next();
    });

  await app.register(
    fastifyHelmet as any,
    {
      contentSecurityPolicy: {
        directives: {
          frameSrc: [
            "'self'",
            'https://*.cardinalcommerce.com',

            // Apollo Sandbox
            'https://sandbox.embed.apollographql.com',
            'https://explorer.embed.apollographql.com',
          ],

          scriptSrc: [
            "'self'",
            "'unsafe-inline'",

            // Apollo Sandbox
            'https://embeddable-sandbox.cdn.apollographql.com',
            'https://apollo-server-landing-page.cdn.apollographql.com',
          ],

          styleSrc: [
            "'self'",
            "'unsafe-inline'",

            'https://fonts.googleapis.com',
            'https://apollo-server-landing-page.cdn.apollographql.com',
            'https://embeddable-sandbox.cdn.apollographql.com',
          ],

          fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],

          imgSrc: [
            "'self'",
            'data:',

            'https://apollo-server-landing-page.cdn.apollographql.com',
          ],

          manifestSrc: [
            "'self'",
            'https://apollo-server-landing-page.cdn.apollographql.com',
          ],

          connectSrc: [
            "'self'",

            // Apollo
            'https://apollo-server-landing-page.cdn.apollographql.com',
            'https://embeddable-sandbox.cdn.apollographql.com',
          ],
        },
      },
    } as any,
  );
  await app.register(fastifyCookie as any);

  app.useGlobalPipes(
    new GraphQLValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: false,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  await app.init();

  const { schema } = app.get(GraphQLSchemaHost);

  const jwtService = app.get(JwtService);

  const sseHandler = createHandler<{ user: jwtPayload }>({
    schema,

    context: async (req) => {
      const cookies = req.headers.get('cookie');

      if (!cookies) {
        throw new UnauthorizedException('Unauthorized');
      }

      const accessToken = cookies
        .split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith('accessToken='))
        ?.split('=')[1];

      if (!accessToken) {
        throw new UnauthorizedException('Unauthorized');
      }

      try {
        const payload = await jwtService.verifyAsync<jwtPayload>(accessToken, {
          secret: process.env.ACCESS_TOKEN_SECRET,
        });

        return {
          user: payload,
        };
      } catch {
        throw new UnauthorizedException('Token is invalid or expired');
      }
    },
  });

  fastify.all('/graphql/sse', async (request, reply) => {
    try {
      await sseHandler(request, reply);
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  });

  await app.listen(3000, '0.0.0.0');
}

bootstrap().catch((err) => {
  winstonLogger.error({
    message: 'Error during application bootstrap',
    error: err instanceof Error ? err.message : err,
    stack: err instanceof Error ? err.stack : undefined,
  });

  process.exit(1);
});
