import { BaseTool, ToolDefinition, ToolResult } from '../base.js';
import { AndroidAutomation } from '../../../android/automation.js';

export class ScreenshotTool extends BaseTool {
  readonly definition: ToolDefinition = {
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
  };

  constructor(private automation: AndroidAutomation) {
    super();
  }

  async execute(args: Record<string, any>): Promise<ToolResult> {
    const { filename, format } = args;
    const screenshotResult = await this.automation.takeScreenshot(filename as string, format as string);

    // Compress image if it's too large (>256KB)
    let compressedBase64 = screenshotResult.base64Data;
    const originalSize = Buffer.byteLength(screenshotResult.base64Data, 'base64');

    if (originalSize > 1024 * 256) { // 256KB
      try {
        const sharp = await import('sharp');
        const imageBuffer = Buffer.from(screenshotResult.base64Data, 'base64');
        
        let quality = 80;
        let compressedBuffer: Buffer = imageBuffer;

        while (compressedBuffer.length > 1024 * 256 && quality > 20) {
          compressedBuffer = await sharp.default(imageBuffer)
            .jpeg({ quality })
            .toBuffer() as Buffer;
          quality -= 10;
        }
        
        compressedBase64 = compressedBuffer.toString('base64');
      } catch (error) {
        // Keep original if compression fails
      }
    }
    
    if (filename && screenshotResult.message) {
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
  }
}

export class ComponentsTool extends BaseTool {
  readonly definition: ToolDefinition = {
    name: 'android_get_components',
    description: 'Get UI component information for element identification.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  };

  constructor(private automation: AndroidAutomation) {
    super();
  }

  async execute(args: Record<string, any>): Promise<ToolResult> {
    const screenInfo = await this.automation.getScreenInfo();
    
    // Debug logging and file writing (keeping original functionality)
    try {
      const fs = await import('fs');
      const path = await import('path');
      const cwd = process.cwd();
      
      const debugDir = path.join(cwd, 'debug');
      
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }
      
      const screenInfoFile = path.join(debugDir, 'debug_components_screenInfo.json');
      const debugInfoFile = path.join(debugDir, 'debug_components_debugInfo.json');
      
      fs.writeFileSync(screenInfoFile, JSON.stringify(screenInfo, null, 2));
      
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
      
      fs.writeFileSync(debugInfoFile, JSON.stringify(debugInfo, null, 2));
    } catch (error) {
      // Ignore debug file errors
    }
    
    return this.createTextResult(JSON.stringify(screenInfo, null, 2));
  }
}