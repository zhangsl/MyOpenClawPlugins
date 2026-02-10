# MyOpenClawPlugins

个人 OpenClaw 扩展工程，通过 Skill 和 Plugin 扩展 OpenClaw 的能力。

## 项目简介

本项目是一个 OpenClaw 插件集合，用于增强 Claude Code / OpenClaw 的功能。通过实现自定义插件，可以添加新的工具、CLI 命令和 Skills，让 AI 助手具备更多实用能力。

## 项目结构

```
MyOpenClawPlugins/
├── README.md                          # 项目说明文档
└── bocha_search/                      # 博查搜索插件
    ├── index.ts                       # 插件入口，注册工具和命令
    ├── openclaw.plugin.json           # 插件配置文件
    ├── package.json                   # npm 包配置
    └── skills/
        └── bocha-search/
            └── SKILL.md               # Skill 说明文档
```

## 插件列表

### 1. 博查搜索 (bocha-search)

使用博查AI搜索获取实时网络信息，特别适合中文搜索场景。

**功能特性：**
- 🔍 中文网页搜索
- 📰 新闻资讯查找
- 📄 长文本摘要支持
- ⏱️ 时间范围筛选（一天内/一周内/一月内/一年内）

**配置要求：**
- 环境变量：`BOCHA_API_KEY` - 博查 API 密钥
- 配置项：可在 `openclaw.plugin.json` 中配置默认返回数量和超时时间

**使用方法：**

```
bocha_web_search
query: 搜索关键词
freshness: oneWeek (可选)
count: 5 (可选)
summary: true (可选)
```

详细使用说明请参考：[bocha_search/skills/bocha-search/SKILL.md](./bocha_search/skills/bocha-search/SKILL.md)

## 安装指南

### 1. 安装插件

将本仓库克隆到 OpenClaw 的插件目录：

```bash
# 克隆到 OpenClaw 插件目录
git clone <your-repo-url> ~/.config/openclaw/plugins/MyOpenClawPlugins
```

### 2. 配置环境变量

对于博查搜索插件，需要设置 API Key：

```bash
export BOCHA_API_KEY="your-bocha-api-key"
```

或将环境变量添加到 `~/.openclaw/.env` 文件。

### 3. 启用插件

在 OpenClaw 配置中启用插件：

```json
{
  "plugins": {
    "entries": {
      "bocha-search": {
        "enabled": true
      }
    }
  }
}
```

## 开发指南

### 创建新插件

1. 新建插件目录

```bash
mkdir my-plugin
cd my-plugin
```

2. 创建 `openclaw.plugin.json` 配置文件

```json
{
  "id": "my-plugin",
  "name": "我的插件",
  "description": "插件描述",
  "version": "1.0.0",
  "configSchema": {
    "type": "object",
    "properties": {}
  },
  "skills": ["./skills"]
}
```

3. 创建 `package.json`

```json
{
  "name": "my-openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "main": "./index.ts",
  "openclaw": {
    "plugin": true
  }
}
```

4. 编写插件入口 `index.ts`

```typescript
import type { OpenClawPluginAPI } from "@openclaw/core";

export default function register(api: OpenClawPluginAPI, config?: unknown) {
  // 注册工具
  api.registerTool({
    name: "my_tool",
    description: "我的工具",
    parameters: Type.Object({}),
    async execute(toolCallId: string, args: unknown) {
      return {
        content: [{ type: "text", text: "Hello World" }],
      };
    },
  });
}
```

5. 创建 Skill 文档（可选）

在 `skills/my-skill/SKILL.md` 中编写 Skill 使用说明。

### 技术栈

- **TypeScript** - 主要开发语言
- **@sinclair/typebox** - JSON Schema 定义
- **@openclaw/core** - OpenClaw 核心 API

## 参考资源

- [OpenClaw 官方文档](https://github.com/anthropics/claude-code)
- [博查 API 文档](https://bochaai.com/)

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 PR 来改进现有插件或添加新插件。
