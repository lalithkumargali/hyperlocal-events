import { Router, type IRouter } from 'express';

export const openApiRouter: IRouter = Router();

// OpenAPI documentation - will be implemented with zod-to-openapi in later sections
openApiRouter.get('/', (_req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'Hyperlocal Events API',
      version: '0.1.0',
      description: 'MCP-powered hyperlocal events platform',
    },
    paths: {},
  });
});
