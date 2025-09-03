import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { AndroidAutomation, FindElementOptions } from '../android/automation.js';
import { logger } from '../utils/logger.js';

const server = new Server(
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

const androidAutomation = new AndroidAutomation();

logger.info('Android MCP Server initialized');

server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug('ListTools request received');
  return {
    tools: [
      {
        name: 'android_get_applist',
        description: 'Get list of installed user applications with package names.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'android_open_app',
        description: 'Launch an Android application by package name.',
        inputSchema: {
          type: 'object',
          properties: {
            packageName: {
              type: 'string',
              description: 'Package name of the app to open (e.g., com.bilibili.app.in, com.sina.weibo)',
            },
          },
          required: ['packageName'],
        },
      },
      {
        name: 'android_get_components',
        description: 'Get UI component information for element identification.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'android_get_screenshot',
        description: 'Capture current screen state.',
        inputSchema: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Optional filename to save the screenshot (if not provided, returns base64 data)',
            },
            format: {
              type: 'string',
              enum: ['pillow', 'raw'],
              description: 'Screenshot format (default: pillow)',
            },
          },
        },
      },
      {
        name: 'android_tap',
        description: 'Tap at screen coordinates.',
        inputSchema: {
          type: 'object',
          properties: {
            x: {
              type: 'number',
              description: 'X coordinate to tap (pixel position)',
            },
            y: {
              type: 'number',
              description: 'Y coordinate to tap (pixel position)',
            },
          },
          required: ['x', 'y'],
        },
      },
      {
        name: 'android_input_text',
        description: 'Input text into focused text field.',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Text to input into the focused element',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'android_scroll',
        description: 'Scroll the screen in the specified direction.',
        inputSchema: {
          type: 'object',
          properties: {
            direction: {
              type: 'string',
              enum: ['up', 'down', 'left', 'right'],
              description: 'Direction to scroll (up/down for vertical, left/right for horizontal)',
            },
          },
          required: ['direction'],
        },
      },
      {
        name: 'android_back',
        description: 'Press the system back button.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
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
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  logger.info(`Tool call received: ${name}`, args);

  if (!args) {
    const error = 'Arguments are required';
    logger.error(error);
    throw new McpError(ErrorCode.InvalidParams, error);
  }

  try {
    logger.debug(`Executing tool: ${name}`);
    switch (name) {
      case 'android_open_app':
        logger.debug(`Opening app: ${args.packageName}`);
        await androidAutomation.openApp(args.packageName as string);
        logger.info(`Successfully opened app: ${args.packageName}`);
        return {
          content: [
            {
              type: 'text',
              text: `Opened app: ${args.packageName}`,
            },
          ],
        };

      case 'android_tap':
        logger.debug(`Tapping at coordinates (${args.x}, ${args.y})`);
        await androidAutomation.tap(args.x as number, args.y as number);
        logger.info(`Successfully tapped at (${args.x}, ${args.y})`);
        return {
          content: [
            {
              type: 'text',
              text: `Tapped at coordinates (${args.x}, ${args.y})`,
            },
          ],
        };


      case 'android_input_text':
        logger.debug(`Inputting text: ${args.text}`);
        await androidAutomation.inputText(args.text as string);
        logger.info(`Successfully input text: ${args.text}`);
        return {
          content: [
            {
              type: 'text',
              text: `Input text: ${args.text}`,
            },
          ],
        };

      case 'android_get_components':
        logger.info('🔍 ==== android_get_components called ====');
        logger.debug('Getting screen components');
        
        try {
          // Check current working directory
          const fs = await import('fs');
          const path = await import('path');
          const cwd = process.cwd();
          logger.info(`📁 Current working directory: ${cwd}`);
          
          const screenInfo = await androidAutomation.getScreenInfo();
          logger.info(`📊 Screen info retrieved: ${screenInfo.elements.length} elements found`);
          logger.debug('Screen dimensions:', { width: screenInfo.width, height: screenInfo.height, currentApp: screenInfo.currentApp });
          
          // Store the complete info for debugging
          const debugDir = path.join(cwd, 'debug');
          
          // Create debug directory if it doesn't exist
          try {
            if (!fs.existsSync(debugDir)) {
              fs.mkdirSync(debugDir, { recursive: true });
              logger.info('📁 Created debug directory');
            }
          } catch (error) {
            logger.warn('⚠️ Failed to create debug directory, using current directory:', error);
          }
          
          const screenInfoFile = path.join(debugDir, 'debug_components_screenInfo.json');
          const debugInfoFile = path.join(debugDir, 'debug_components_debugInfo.json');
          
          try {
            fs.writeFileSync(screenInfoFile, JSON.stringify(screenInfo, null, 2));
            logger.info(`✅ Screen info written to ${screenInfoFile}`);
          } catch (error) {
            logger.error('❌ Failed to write debug_components_screenInfo.json:', error);
            // Try writing to current directory
            try {
              fs.writeFileSync('debug_components_screenInfo.json', JSON.stringify(screenInfo, null, 2));
              logger.info('✅ Screen info written to current directory: debug_components_screenInfo.json');
            } catch (fallbackError) {
              logger.error('❌ Failed to write to current directory as well:', fallbackError);
            }
          }

          const debugInfo = {
            timestamp: new Date().toISOString(),
            original: screenInfo,
            simplified: {
              width: screenInfo.width,
              height: screenInfo.height,
              currentApp: screenInfo.currentApp,
              elementCount: screenInfo.elements.length,
              interactableElements: screenInfo.elements.filter(el => el.description || el.resourceId).length
            }
          };
          
          try {
            fs.writeFileSync(debugInfoFile, JSON.stringify(debugInfo, null, 2));
            logger.info(`✅ Debug info written to ${debugInfoFile}`);
          } catch (error) {
            logger.error('❌ Failed to write debug_components_debugInfo.json:', error);
            // Try writing to current directory
            try {
              fs.writeFileSync('debug_components_debugInfo.json', JSON.stringify(debugInfo, null, 2));
              logger.info('✅ Debug info written to current directory: debug_components_debugInfo.json');
            } catch (fallbackError) {
              logger.error('❌ Failed to write to current directory as well:', fallbackError);
            }
          }
          
          logger.info('🎯 ==== android_get_components completed ====');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(screenInfo, null, 2),
              },
            ],
          };
        } catch (error) {
          logger.error('❌ Error in android_get_components:', error);
          throw error;
        }

      case 'android_back':
        logger.debug('Pressing back button');
        await androidAutomation.back();
        logger.info('Successfully pressed back button');
        return {
          content: [
            {
              type: 'text',
              text: 'Pressed back button',
            },
          ],
        };

      case 'android_scroll':
        logger.debug(`Scrolling ${args.direction}`);
        await androidAutomation.scroll(args.direction as 'up' | 'down' | 'left' | 'right');
        logger.info(`Successfully scrolled ${args.direction}`);
        return {
          content: [
            {
              type: 'text',
              text: `Scrolled ${args.direction}`,
            },
          ],
        };

      case 'android_get_screenshot':
        logger.debug('Taking screenshot', { filename: args.filename, format: args.format });
        const screenshotResult = await androidAutomation.takeScreenshot(args.filename as string, args.format as string);

        // Compress image if it's too large (>256KB)
        let compressedBase64 = screenshotResult.base64Data;
        const originalSize = Buffer.byteLength(screenshotResult.base64Data, 'base64');
        logger.debug(`Screenshot original size: ${Math.round(originalSize/1024)}KB`);

        if (originalSize > 1024 * 256) { // 256KB
          try {
            logger.debug('Compressing screenshot image');
            const sharp = await import('sharp');
            const imageBuffer = Buffer.from(screenshotResult.base64Data, 'base64');
            
            let quality = 80;
            let compressedBuffer: Buffer = imageBuffer;

            // Iteratively compress until under 256KB
            while (compressedBuffer.length > 1024 * 256 && quality > 20) {
              compressedBuffer = await sharp.default(imageBuffer)
                .jpeg({ quality })
                .toBuffer() as Buffer;
              quality -= 10;
            }
            
            compressedBase64 = compressedBuffer.toString('base64');
            const finalSize = compressedBuffer.length;
            logger.info(`Image compressed from ${Math.round(originalSize/1024)}KB to ${Math.round(finalSize/1024)}KB`);
          } catch (error) {
            logger.warn('Failed to compress image:', error);
            // Keep original if compression fails
          }
        }
        
        if (args.filename && screenshotResult.message) {
          // If filename is provided, save to file AND return the image data
          return {
            content: [
              {
                type: 'text',
                text: screenshotResult.message,
              },
              {
                type: 'image',
                data: compressedBase64,
                mimeType: originalSize > 1024 * 256 ? 'image/jpeg' : 'image/png',
              },
            ],
          };
        } else {
          // Return base64 image data directly for AI analysis
          return {
            content: [
              {
                type: 'image',
                data: compressedBase64,
                mimeType: originalSize > 1024 * 256 ? 'image/jpeg' : 'image/png',
              },
            ],
          };
        }

      case 'android_wait':
        const duration = (args.duration as number) || 1000;
        const reason = args.reason as string;
        logger.debug(`Waiting ${duration}ms`, { reason });
        await new Promise(resolve => setTimeout(resolve, duration));
        logger.info(`Wait completed: ${duration}ms`);
        return {
          content: [
            {
              type: 'text',
              text: reason 
                ? `Waited ${duration}ms - ${reason}`
                : `Waited ${duration}ms`,
            },
          ],
        };

      case 'android_get_applist':
        logger.debug('Getting app list');
        const appList = await androidAutomation.getInstalledApps();
        logger.info(`Found ${appList.length} installed apps`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(appList, null, 2),
            },
          ],
        };

      default:
        const errorMsg = `Unknown tool: ${name}`;
        logger.error(errorMsg);
        throw new McpError(
          ErrorCode.MethodNotFound,
          errorMsg
        );
    }
  } catch (error) {
    const errorMsg = `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMsg, { error, args });
    throw new McpError(
      ErrorCode.InternalError,
      errorMsg
    );
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  logger.info('Starting Android MCP Server...');
  await server.connect(transport);
  logger.info('Android MCP Server running on stdio');
}

export { runServer };