import DataLoader from 'dataloader';
import { FastifyReply, FastifyRequest } from 'fastify';
import { jwtPayload } from 'src/common/interfaces/jwt-payload.interface';

export interface GraphQLContext {
  reply: FastifyReply;
  request: FastifyRequest;
  user?: jwtPayload;
}
