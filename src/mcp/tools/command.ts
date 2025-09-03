import { ToolResult } from './base.js';
import { ToolRegistry } from './registry.js';
import { logger } from '../../utils/logger.js';

export interface Command {
  name: string;
  args: Record<string, any>;
}

export interface CommandHandler {
  execute(command: Command): Promise<ToolResult>;
}

export class AndroidCommandHandler implements CommandHandler {
  constructor(private registry: ToolRegistry) {}

  async execute(command: Command): Promise<ToolResult> {
    const { name, args } = command;
    
    logger.info(`Executing command: ${name}`, args);
    
    const tool = this.registry.get(name);
    if (!tool) {
      const error = `Tool '${name}' not found`;
      logger.error(error);
      throw new Error(error);
    }

    try {
      logger.debug(`Tool found: ${name}, executing...`);
      const result = await tool.execute(args);
      logger.info(`Command '${name}' executed successfully`);
      return result;
    } catch (error) {
      const errorMsg = `Error executing command '${name}': ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg, { error, args });
      throw new Error(errorMsg);
    }
  }
}

export class CommandValidator {
  static validate(command: Command, schema: any): boolean {
    const { name, args } = command;
    
    if (!name || typeof name !== 'string') {
      throw new Error('Command name is required and must be a string');
    }
    
    if (!args || typeof args !== 'object') {
      throw new Error('Command args is required and must be an object');
    }
    
    // Basic schema validation
    if (schema.required) {
      for (const requiredField of schema.required) {
        if (!(requiredField in args)) {
          throw new Error(`Required field '${requiredField}' is missing`);
        }
      }
    }
    
    return true;
  }
}

export class CommandProcessor {
  constructor(
    private handler: CommandHandler,
    private registry: ToolRegistry
  ) {}

  async process(command: Command): Promise<ToolResult> {
    // Get tool definition for validation
    const tool = this.registry.get(command.name);
    if (!tool) {
      throw new Error(`Tool '${command.name}' not found`);
    }
    
    // Validate command
    CommandValidator.validate(command, tool.definition.inputSchema);
    
    // Execute command
    return await this.handler.execute(command);
  }
}