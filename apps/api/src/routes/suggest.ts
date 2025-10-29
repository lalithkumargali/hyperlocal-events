import { Router, type IRouter } from 'express';

import { suggestController } from '../controllers/suggest';

export const suggestRouter: IRouter = Router();

suggestRouter.post('/', suggestController);
