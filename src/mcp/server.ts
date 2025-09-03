import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { AndroidAutomation } from '../android/automation.js';
import { logger } from '../utils/logger.js';
import { ToolFactory } from './tools/factory.js';
import { AndroidCommandHandler, CommandProcessor } from './tools/command.js';

export class AndroidMCPServer {
  private server: Server;
  private androidAutomation: AndroidAutomation;
  private toolFactory: ToolFactory;
  private commandProcessor: CommandProcessor;

  constructor() {
    this.server = new Server(
      {
        name: 'android-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.androidAutomation = new AndroidAutomation();
    this.toolFactory = new ToolFactory(this.androidAutomation);
    
    const commandHandler = new AndroidCommandHandler(this.toolFactory.getRegistry());
    this.commandProcessor = new CommandProcessor(commandHandler, this.toolFactory.getRegistry());

    this.setupRequestHandlers();
    logger.info('Android MCP Server initialized');
  }

  private setupRequestHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('ListTools request received');
      return {
        tools: this.toolFactory.getRegistry().getAllDefinitions(),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      logger.info(`Tool call received: ${name}`, args);

      if (!args) {
        const error = 'Arguments are required';
        logger.error(error);
        throw new McpError(ErrorCode.InvalidParams, error);
      }

      try {
        logger.debug(`Processing command: ${name}`);
        const result = await this.commandProcessor.process({ name, args });
        logger.info(`Command '${name}' processed successfully`);
        return { content: result.content };
      } catch (error) {
        const errorMsg = `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`;
        logger.error(errorMsg, { error, args });
        throw new McpError(
          ErrorCode.InternalError,
          errorMsg
        );
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    logger.info('Starting Android MCP Server...');
    await this.server.connect(transport);
    logger.info('Android MCP Server running on stdio');
  }

  getToolsByCategory(category: string) {
    return this.toolFactory.getToolsByCategory(category);
  }

  getAllCategories() {
    return this.toolFactory.getAllCategories();
  }
}

export async function runServer() {
  const mcpServer = new AndroidMCPServer();
  await mcpServer.start();
}