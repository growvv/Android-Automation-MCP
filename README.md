# Android MCP Server

🤖 **Android自动化助手** - 通过自然语言控制你的Android设备

一个基于MCP (Model Context Protocol) 的Android自动化服务器，让你可以用自然语言指令控制Android应用，支持复杂的自动化流程。

---

## 🎯 面向用户 - 快速使用

> 如果你只是想使用Android自动化功能，请看这一部分

### 📦 安装使用

#### 方式1: NPM全局安装 (推荐)
```bash
npm install -g android-mcp
```

#### 方式2: 直接运行
```bash
npx android-mcp
```

### 🔧 CherryStudio配置

将以下配置添加到你的CherryStudio MCP设置中：

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

或者复制使用我们提供的配置文件：
```bash
# 复制用户配置文件到CherryStudio
cp mcp-config-user.json ~/.cherrystudio/mcp-config.json
```

### 🚀 快速开始

确保你的Android设备已连接并开启USB调试，然后就可以开始使用了：

#### 基础操作
```
"打开微信"
"截图看看当前界面" 
"向下滚动查看更多"
"点击搜索按钮"
"输入文本：Hello"
"返回上一页"
```

#### 智能搜索
```
"在微博搜索Android开发"
"打开淘宝搜索手机"
"在B站搜索编程教程"
```

#### 复合操作
```
"打开微信，搜索张三，发送消息"
"打开设置，找到WiFi选项"
"在应用商店搜索游戏并下载第一个"
```

### 📱 支持的应用

- **社交**: 微信、QQ、微博、抖音
- **购物**: 淘宝、京东、拼多多  
- **娱乐**: B站、爱奇艺、网易云音乐
- **工具**: 设置、文件管理器、浏览器
- **其他**: 大部分Android应用

### 📋 常用应用包名

| 应用名称 | 包名 | 启动指令 |
|---------|------|---------|
| 微信 | `com.tencent.mm` | "打开微信" |
| QQ | `com.tencent.mobileqq` | "打开QQ" |
| 微博 | `com.sina.weibo` | "打开微博" |
| 淘宝 | `com.taobao.taobao` | "打开淘宝" |
| B站 | `tv.danmaku.bili` | "打开B站" |

### 🔧 设备准备

1. **连接设备**: USB连接Android设备或启动模拟器
2. **开启调试**: 设置 > 开发者选项 > USB调试
3. **确认连接**: 运行 `adb devices` 确认设备已连接
4. **授权调试**: 在设备上允许USB调试授权

### ❓ 常见问题

#### 设备连接问题
- 确保已安装ADB工具
- 检查设备是否显示在 `adb devices` 中
- 重新插拔USB线或重启ADB服务

#### 应用操作问题  
- 确保目标应用已安装
- 某些应用可能需要先登录
- UI布局变化可能影响自动化效果

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

```bash
# 复制开发配置
cp mcp-config-dev.json ~/.cherrystudio/mcp-config.json
```

或手动配置：

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

### 📁 项目结构

```
src/
├── android/
│   └── automation.ts      # 核心Android自动化功能
├── automation/
│   ├── nlp-executor.ts    # 自然语言任务处理
│   ├── flows.ts          # 通用自动化流程
│   └── bilibili.ts       # B站专用自动化
├── mcp/
│   └── server.ts         # MCP服务器实现
└── index.ts              # 程序入口点
```

### 🛠️ 开发脚本

| 命令 | 描述 | 用途 |
|------|------|------|
| `npm run build` | 编译TypeScript | 生产环境部署 |
| `npm run dev` | 开发模式运行 | 本地开发测试 |
| `npm run start` | 运行编译后代码 | 生产环境运行 |
| `npm run typecheck` | 类型检查 | 代码质量保证 |
| `npm run test` | 运行测试 | 功能验证 |
| `npm run clean` | 清理构建文件 | 重新构建 |

### 🔌 MCP工具API

#### 核心工具

| 工具名称 | 功能描述 | 参数 |
|---------|----------|------|
| `android_get_applist` | 获取已安装应用列表 | 无 |
| `android_open_app` | 启动指定应用 | `packageName` |
| `android_tap` | 在指定坐标点击 | `x, y` |
| `android_input_text` | 输入文本 | `text` |
| `android_get_components` | 获取UI组件信息 | 无 |
| `android_back` | 按返回键 | 无 |
| `android_scroll` | 滚动屏幕 | `direction, distance` |
| `android_get_screenshot` | 截取屏幕 | 无 |
| `android_wait` | 等待操作完成 | `milliseconds` |

#### 高级工具

| 工具名称 | 功能描述 | 参数 |
|---------|----------|------|
| `android_find_and_tap` | 查找并点击元素 | `text, type` |
| `android_search` | 搜索功能 | `query, appName` |
| `android_auto_task` | 自然语言任务执行 | `instruction` |

### 🧪 测试与调试

#### 单元测试
```bash
npm test
```

#### 集成测试  
```bash
# 测试MCP连接
npm run test:mcp

# 测试Android连接
npm run test:android
```

#### 调试技巧
- 使用 `android_get_screenshot` 查看当前界面状态
- 使用 `android_get_components` 分析UI结构 
- 检查控制台日志定位问题
- 使用ADB工具验证设备连接

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

#### 2. 添加应用专用自动化
```typescript
// src/automation/newapp.ts
export class NewAppAutomation {
  constructor(private android: AndroidAutomation) {}
  
  async specificFunction(param: string) {
    // 应用特定逻辑
  }
}
```

#### 3. 扩展自然语言处理
```typescript
// src/automation/nlp-executor.ts
// 添加新的指令模式匹配
```

### 📦 打包发布

#### 本地打包
```bash
npm run build
npm pack
```

#### 发布到NPM
```bash
npm run prepare
npm publish
```

#### Docker部署
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### 🤝 贡献指南

1. **Fork项目** 并创建特性分支
2. **编写代码** 并确保通过类型检查
3. **添加测试** 覆盖新功能
4. **更新文档** 说明变更内容  
5. **提交PR** 并描述变更原因

#### 代码规范
- 使用TypeScript严格模式
- 遵循ESLint配置规则
- 添加JSDoc注释
- 保持代码简洁可读

### 🐛 故障排除

#### 常见开发问题

1. **TypeScript编译错误**
   ```bash
   npm run typecheck
   ```

2. **MCP连接失败**  
   - 检查端口占用
   - 验证配置文件格式
   - 查看服务器日志

3. **Android自动化失败**
   - 确认ADB设备连接
   - 检查应用是否已安装
   - 验证UI元素选择器

4. **依赖安装问题**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## 📄 许可证

ISC License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Model Context Protocol](https://github.com/modelcontextprotocol) - MCP协议支持
- [uiautomator2](https://github.com/openatx/uiautomator2) - Android自动化核心
- [ADBKit](https://github.com/DeviceFarmer/adbkit) - ADB接口库