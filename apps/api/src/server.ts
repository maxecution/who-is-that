import Fastify from 'fastify';

const server = Fastify({
  logger: true,
});

// health check
server.get('/', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await server.listen({ port: 3001 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
