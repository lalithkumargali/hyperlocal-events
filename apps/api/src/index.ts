import dotenv from 'dotenv';

import { app } from './app';
import { logger } from './lib/logger';

dotenv.config();

const PORT = process.env.API_PORT || 3001;
const HOST = process.env.API_HOST || 'localhost';

app.listen(Number(PORT), HOST, () => {
  logger.info(`API server running on http://${HOST}:${PORT}`);
  logger.info(`OpenAPI docs available at http://${HOST}:${PORT}/api-docs`);
});
