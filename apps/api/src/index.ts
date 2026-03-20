import { buildServer } from './server';

const start = async () => {
  const server = buildServer();

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
