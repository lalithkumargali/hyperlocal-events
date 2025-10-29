import { Router, type IRouter } from 'express';

import { suggestController } from '../controllers/suggest';
import { apiKeyAuth } from '../middleware/api-key';
import { partnerRateLimit } from '../middleware/rate-limit';

export const partnerRouter: IRouter = Router();

// Apply API key authentication and rate limiting to all partner routes
partnerRouter.use(apiKeyAuth);
partnerRouter.use(partnerRateLimit);

// Partner suggest endpoint (same logic as public endpoint)
partnerRouter.post('/suggest', suggestController);
