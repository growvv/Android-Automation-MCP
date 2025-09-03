import { ToolRegistry } from './registry.js';
import { AndroidAutomation } from '../../android/automation.js';

// App Management Tools
import { AppManagementTool, AppListTool } from './categories/app.js';

// Interaction Tools
import { TapTool, InputTextTool, ScrollTool, BackTool } from './categories/interaction.js';

// Screen Tools
import { ScreenshotTool, ComponentsTool } from './categories/screen.js';

// Utility Tools
import { WaitTool } from './categories/utility.js';

export class ToolFactory {
  private registry = new ToolRegistry();

  constructor(private automation: AndroidAutomation) {
    this.registerAllTools();
  }

  private registerAllTools(): void {
    // Register App Management Tools
    this.registry.register(new AppManagementTool(this.automation), 'app');
    this.registry.register(new AppListTool(this.automation), 'app');

    // Register Interaction Tools  
    this.registry.register(new TapTool(this.automation), 'interaction');
    this.registry.register(new InputTextTool(this.automation), 'interaction');
    this.registry.register(new ScrollTool(this.automation), 'interaction');
    this.registry.register(new BackTool(this.automation), 'interaction');

    // Register Screen Tools
    this.registry.register(new ScreenshotTool(this.automation), 'screen');
    this.registry.register(new ComponentsTool(this.automation), 'screen');

    // Register Utility Tools
    this.registry.register(new WaitTool(), 'utility');
  }

  getRegistry(): ToolRegistry {
    return this.registry;
  }

  getToolsByCategory(category: string) {
    return this.registry.getToolsByCategory(category);
  }

  getAllCategories() {
    return this.registry.getCategories();
  }
}