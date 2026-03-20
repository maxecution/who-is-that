import { buildServer } from './server';

const start = async () => {
  const isDev = process.env.NODE_ENV === 'development';
  const server = buildServer(isDev);

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
