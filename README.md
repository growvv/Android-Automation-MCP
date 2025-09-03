# Android MCP Server

🤖 **Android自动化助手** - 通过自然语言控制你的Android设备

一个基于MCP (Model Context Protocol) 的Android自动化服务器，让你可以用自然语言指令控制Android应用，支持复杂的自动化流程。

---

## 🎯 面向用户 - 快速使用

> 如果你只是想使用Android自动化功能，请看这一部分

### 📦 设备准备

1. **连接设备**: USB连接Android设备或启动模拟器
2. **开启调试**: 设置 > 开发者选项 > USB调试
3. **确认连接**: 运行 `adb devices` 确认设备已连接
4. **授权调试**: 在设备上允许USB调试授权

### 🔧 MCP客户端配置

将以下配置添加到你的MCP客户端设置中， 例如Cursor, Claude Code, CherryStudio(推荐)：

```json
{
  "mcpServers": {
    "android-automation": {
      "command": "npx",
      "args": ["android-mcp"],
      "description": "Android自动化助手"
    }
  }
}
```

---

## 🛠️ 面向开发者 - 开发指南

> 如果你想参与开发或本地部署，请看这一部分

### 📋 环境要求

- **Node.js**: 16+ 
- **TypeScript**: 5.0+
- **Android SDK**: ADB工具
- **Python**: 3.7+ (可选，用于uiautomator2增强功能)

### 🚀 快速启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd andriod_mcp

# 2. 安装依赖
npm install

# 3. 开发模式运行
npm run dev

# 或者编译后运行
npm run build
npm start
```

### 🔧 CherryStudio开发配置

使用开发配置文件：

```json
{
  "mcpServers": {
    "android-mcp-dev": {
      "command": "npm",
      "args": ["run", "dev"], 
      "cwd": "/path/to/andriod_mcp",
      "description": "开发模式的Android MCP服务器"
    }
  }
}
```

### 🔧 添加新功能

#### 1. 添加新的MCP工具
```typescript
// src/mcp/server.ts
server.addTool({
  name: "android_new_feature",
  description: "新功能描述",
  inputSchema: {
    type: "object",
    properties: {
      param: { type: "string", description: "参数描述" }
    }
  }
}, async (args) => {
  // 实现功能逻辑
});
```

---

## 📄 许可证

ISC License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Model Context Protocol](https://github.com/modelcontextprotocol) - MCP协议支持
- [uiautomator2](https://github.com/openatx/uiautomator2) - Android自动化核心