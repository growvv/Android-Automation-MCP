import { BaseTool, ToolDefinition, ToolResult } from '../base.js';
import { AndroidAutomation } from '../../../android/automation.js';

export class AppManagementTool extends BaseTool {
  readonly definition: ToolDefinition = {
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
  };

  constructor(private automation: AndroidAutomation) {
    super();
  }

  async execute(args: Record<string, any>): Promise<ToolResult> {
    const { packageName } = args;
    await this.automation.openApp(packageName as string);
    return this.createTextResult(`Opened app: ${packageName}`);
  }
}

export class AppListTool extends BaseTool {
  readonly definition: ToolDefinition = {
    name: 'android_get_applist',
    description: 'Get list of installed user applications with package names.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  };

  constructor(private automation: AndroidAutomation) {
    super();
  }

  async execute(args: Record<string, any>): Promise<ToolResult> {
    const appList = await this.automation.getInstalledApps();
    return this.createTextResult(JSON.stringify(appList, null, 2));
  }
}