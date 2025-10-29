import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { logger } from './lib/logger';
import { errorHandler } from './middleware/error-handler';
import { eventsRouter } from './routes/events';
import { healthRouter } from './routes/health';
import { openApiRouter } from './routes/openapi';

export const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

// Routes
app.use('/health', healthRouter);
app.use('/api/events', eventsRouter);
app.use('/api-docs', openApiRouter);

// Error handling
app.use(errorHandler);

export default app;
