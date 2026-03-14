import Fastify, { FastifyInstance } from 'fastify';
import pokemonRoutes from './routes/pokemon';

const server: FastifyInstance = Fastify({
  logger: true,
});

// health check
server.get('/', async () => {
  return { status: 'ok' };
});

// register API routes
server.register(pokemonRoutes, {
  prefix: '/api/pokemon',
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;

    await server.listen({
      port,
      host: '0.0.0.0',
    });

    server.log.info(`API running on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
