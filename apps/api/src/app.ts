import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { logger } from './lib/logger';
import { errorHandler } from './middleware/error-handler';
import { metricsMiddleware } from './middleware/metrics';
import { eventsRouter } from './routes/events';
import { healthRouter } from './routes/health';
import { metricsRouter } from './routes/metrics';
import { openApiRouter } from './routes/openapi';
import { partnerRouter } from './routes/partner';
import { suggestRouter } from './routes/suggest';

export const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(metricsMiddleware);

// Routes
app.use('/health', healthRouter);
app.use('/metrics', metricsRouter);
app.use('/v1/suggest', suggestRouter);
app.use('/v1/partner', partnerRouter);
app.use('/v1/events', eventsRouter);
app.use('/', openApiRouter);

// Error handling
app.use(errorHandler);

export default app;
