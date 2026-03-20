import Fastify, { FastifyInstance } from 'fastify';
import pokemonRoutes from './routes/pokemon';

export function buildServer(logger: boolean = false): FastifyInstance {
  const server: FastifyInstance = Fastify({
    logger,
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
