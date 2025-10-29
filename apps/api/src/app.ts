import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { logger } from './lib/logger';
import { errorHandler } from './middleware/error-handler';
import { eventsRouter } from './routes/events';
import { healthRouter } from './routes/health';
import { openApiRouter } from './routes/openapi';
import { suggestRouter } from './routes/suggest';

export const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

// Routes
app.use('/health', healthRouter);
app.use('/v1/suggest', suggestRouter);
app.use('/api/events', eventsRouter);
app.use('/openapi.json', openApiRouter);

// Error handling
app.use(errorHandler);

export default app;
