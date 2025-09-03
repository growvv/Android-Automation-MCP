export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolResult {
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
}

export interface ToolHandler {
  execute(args: Record<string, any>): Promise<ToolResult>;
}

export abstract class BaseTool implements ToolHandler {
  abstract readonly definition: ToolDefinition;
  
  abstract execute(args: Record<string, any>): Promise<ToolResult>;
  
  protected createTextResult(text: string): ToolResult {
    return {
      content: [{ type: 'text', text }]
    };
  }
  
  protected createImageResult(data: string, mimeType: string, text?: string): ToolResult {
    const content: ToolResult['content'] = [{ type: 'image', data, mimeType }];
    if (text) {
      content.unshift({ type: 'text', text });
    }
    return { content };
  }
}