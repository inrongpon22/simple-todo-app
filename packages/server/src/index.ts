import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { createProducer } from './lib/kafka.js';

const port = Number(process.env.PORT ?? 4000);

const start = async (): Promise<void> => {
  await createProducer();

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start server.', error);
  process.exit(1);
});
