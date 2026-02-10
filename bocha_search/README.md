# 博查搜索 OpenClaw Plugin

使用博查AI搜索获取实时网络信息的 OpenClaw 插件，支持中文搜索和长文本摘要。

## 安装

### 1. 设置环境变量

```bash
export BOCHA_API_KEY=sk-your-api-key
```

### 2. 复制插件到 extensions 目录

```bash
mkdir -p ~/.openclaw/extensions/
cp -r /path/to/bocha_search ~/.openclaw/extensions/
```

### 3. 在 `claude.json` 中启用插件

```json
{
  "plugins": {
    "entries": {
      "bocha-search": {
        "enabled": true,
        "config": {
          "defaultCount": 5,
          "timeout": 30000
        }
      }
    }
  }
}
```

### 或者通过配置路径加载

```json
{
  "plugins": {
    "load": {
      "paths": ["/path/to/bocha_search"]
    }
  }
}
```

## 获取 API Key

1. 访问 [博查AI官网](https://bochaai.com)
2. 注册账号并创建应用
3. 获取 API Key

## 使用方法

安装后，Claude 会自动获得 `bocha_web_search` tool。

示例对话：
- "搜索一下最新的 AI 新闻" → Claude 会调用 `bocha_web_search`
- "用博查查一下 React 19 的新特性" → 明确指定使用博查搜索

## 与内置 web_search 的区别

| 特性 | 博查搜索 | 内置 web_search |
|------|---------|----------------|
| 中文支持 | ⭐⭐⭐ 优秀 | ⭐⭐ 一般 |
| 长文本摘要 | ✅ 支持 | ❌ 不支持 |
| 响应速度 | 较快 | 取决于 provider |
| 价格 | 按量计费 | 取决于 provider |

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `defaultCount` | number | 5 | 默认返回结果数量 (1-10) |
| `timeout` | number | 30000 | 请求超时时间 (毫秒) |

## 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `BOCHA_API_KEY` | 是 | 博查 API Key |

## 文件结构

```
bocha_search/
├── openclaw.plugin.json    # Plugin 清单
├── index.ts                # 入口文件，注册 tool
├── skills/                 # Skill 文档
│   └── bocha-search/
│       └── SKILL.md        # AI 使用指南
├── package.json            # 包信息
└── README.md               # 本文件
```

## 原代码对比

原代码 (`bocha_search.js`)：
- CommonJS 格式
- 简单对象导出
- API Key 硬编码

改造后：
- ES Module 格式
- Plugin 标准接口 (`register` 函数)
- API Key 从环境变量读取
- TypeBox Schema 定义
- 附带 Skill 文档

## License

MIT
