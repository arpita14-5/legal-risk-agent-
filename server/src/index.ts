import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import { getRepository } from './db/repository.js';
import { seedInitialData } from './db/seed.js';

async function bootstrap() {
  const app = express();

  // CORS configuration
  app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }));

  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Static uploads directory
  app.use('/uploads', express.static(config.uploadDir));

  // Mount API
  app.use('/api', apiRouter);

  // Initialize DB & Seed Data
  try {
    await getRepository();
    await seedInitialData();
  } catch (err) {
    console.error('Database initialization error:', err);
  }

  // Error handling middleware
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  const server = app.listen(config.port, () => {
    console.log(`
========================================================================
   🛡️  LexGuard — AI Legal Intelligence & Contract Risk Platform
========================================================================
  • Server listening on: http://localhost:${config.port}
  • API Endpoint:        http://localhost:${config.port}/api
  • AI Provider:         ${config.isDemoMode ? 'Demo AI Mode (Deterministic Rule & NLP Grounded)' : config.aiProvider}
  • Pre-seeded Login:    counsel@lexguard.ai (pwd: password123)
  • Admin Login:         admin@lexguard.ai (pwd: password123)
========================================================================
    `);
  });

  return server;
}

bootstrap();
