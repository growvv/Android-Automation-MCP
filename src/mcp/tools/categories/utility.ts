import { BaseTool, ToolDefinition, ToolResult } from '../base.js';

export class WaitTool extends BaseTool {
  readonly definition: ToolDefinition = {
    name: 'android_wait',
    description: 'Wait for a specified duration.',
    inputSchema: {
      type: 'object',
      properties: {
        duration: {
          type: 'number',
          description: 'Wait duration in milliseconds (default: 1000ms, recommended range: 500-3000ms)',
          minimum: 100,
          maximum: 10000,
        },
        reason: {
          type: 'string',
          description: 'Optional description of why waiting is needed (e.g., "waiting for app to load", "waiting for animation to complete")',
        },
      },
    },
  };

  async execute(args: Record<string, any>): Promise<ToolResult> {
    const duration = (args.duration as number) || 1000;
    const reason = args.reason as string;
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return this.createTextResult(
      reason 
        ? `Waited ${duration}ms - ${reason}`
        : `Waited ${duration}ms`
    );
  }
}