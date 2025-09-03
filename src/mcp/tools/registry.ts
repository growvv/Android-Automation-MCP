import { BaseTool, ToolDefinition } from './base.js';

export class ToolRegistry {
  private tools = new Map<string, BaseTool>();
  private categories = new Map<string, string[]>();

  register(tool: BaseTool, category?: string): void {
    const name = tool.definition.name;
    
    if (this.tools.has(name)) {
      throw new Error(`Tool '${name}' is already registered`);
    }
    
    this.tools.set(name, tool);
    
    if (category) {
      if (!this.categories.has(category)) {
        this.categories.set(category, []);
      }
      this.categories.get(category)!.push(name);
    }
  }

  get(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  getToolsByCategory(category: string): BaseTool[] {
    const toolNames = this.categories.get(category) || [];
    return toolNames.map(name => this.tools.get(name)!).filter(Boolean);
  }

  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  getAllDefinitions(): ToolDefinition[] {
    return this.getAllTools().map(tool => tool.definition);
  }

  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  unregister(name: string): boolean {
    const tool = this.tools.get(name);
    if (!tool) return false;

    this.tools.delete(name);
    
    // Remove from categories
    for (const [category, tools] of this.categories.entries()) {
      const index = tools.indexOf(name);
      if (index !== -1) {
        tools.splice(index, 1);
        if (tools.length === 0) {
          this.categories.delete(category);
        }
      }
    }
    
    return true;
  }

  clear(): void {
    this.tools.clear();
    this.categories.clear();
  }
}