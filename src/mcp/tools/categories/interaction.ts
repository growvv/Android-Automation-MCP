import { BaseTool, ToolDefinition, ToolResult } from '../base.js';
import { AndroidAutomation } from '../../../android/automation.js';

export class TapTool extends BaseTool {
  readonly definition: ToolDefinition = {
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
  };

  constructor(private automation: AndroidAutomation) {
    super();
  }

  async execute(args: Record<string, any>): Promise<ToolResult> {
    const { x, y } = args;
    await this.automation.tap(x as number, y as number);
    return this.createTextResult(`Tapped at coordinates (${x}, ${y})`);
  }
}

export class InputTextTool extends BaseTool {
  readonly definition: ToolDefinition = {
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
  };

  constructor(private automation: AndroidAutomation) {
    super();
  }

  async execute(args: Record<string, any>): Promise<ToolResult> {
    const { text } = args;
    await this.automation.inputText(text as string);
    return this.createTextResult(`Input text: ${text}`);
  }
}

export class ScrollTool extends BaseTool {
  readonly definition: ToolDefinition = {
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
  };

  constructor(private automation: AndroidAutomation) {
    super();
  }

  async execute(args: Record<string, any>): Promise<ToolResult> {
    const { direction } = args;
    await this.automation.scroll(direction as 'up' | 'down' | 'left' | 'right');
    return this.createTextResult(`Scrolled ${direction}`);
  }
}

export class BackTool extends BaseTool {
  readonly definition: ToolDefinition = {
    name: 'android_back',
    description: 'Press the system back button.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  };

  constructor(private automation: AndroidAutomation) {
    super();
  }

  async execute(args: Record<string, any>): Promise<ToolResult> {
    await this.automation.back();
    return this.createTextResult('Pressed back button');
  }
}