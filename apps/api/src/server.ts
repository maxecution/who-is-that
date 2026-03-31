import Fastify, { FastifyInstance } from 'fastify';
import pokemonRoutes from './routes/pokemon';

export function buildServer(logger: boolean = false): FastifyInstance {
  const server: FastifyInstance = Fastify({
    logger,
  });

  server.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  });

  // health check
  server.get('/', async () => {
    return { status: 'ok' };
  });

  // register API routes
  server.register(pokemonRoutes, {
    prefix: '/api/pokemon',
  });

  return server;
}
