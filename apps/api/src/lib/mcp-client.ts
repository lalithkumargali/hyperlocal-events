import { logger } from './logger';
import { mcpCallsTotal, mcpCallDuration } from './metrics';

/**
 * MCP Client for calling MCP server tools
 * In production, this would use HTTP or IPC to communicate with the MCP server
 * For now, we'll import directly since they're in the same monorepo
 */

interface MCPCallOptions {
  tool: string;
  arguments: Record<string, unknown>;
}

interface MCPResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Call an MCP tool
 * In production, this would make an HTTP request to the MCP server
 */
export async function callMCPTool<T = unknown>(options: MCPCallOptions): Promise<MCPResponse<T>> {
  const { tool, arguments: args } = options;
  const startTime = Date.now();

  logger.info({ tool, args }, 'Calling MCP tool');

  try {
    // For now, import and call directly
    // In production, this would be an HTTP/IPC call
    const { pipelineSuggest } = await import('@hyperlocal/mcp-server/src/tools/pipeline');

    if (tool === 'pipeline.suggest') {
      const result = await pipelineSuggest(args);

      // Track metrics
      const duration = (Date.now() - startTime) / 1000;
      mcpCallsTotal.labels(tool, 'success').inc();
      mcpCallDuration.labels(tool).observe(duration);

      return {
        success: true,
        data: result as T,
      };
    }

    throw new Error(`Unknown MCP tool: ${tool}`);
  } catch (error) {
    // Track failure
    mcpCallsTotal.labels(tool, 'error').inc();

    logger.error({ error, tool }, 'MCP tool call failed');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
