import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "@openclaw/core";

// 博查搜索响应类型
interface BochaWebPage {
  name: string;
  url: string;
  siteName?: string;
  datePublished?: string;
  summary?: string;
  snippet?: string;
}

interface BochaSearchResponse {
  code: number;
  message?: string;
  data?: {
    webPages?: {
      value: BochaWebPage[];
    };
  };
}

// Plugin 配置类型
interface BochaConfig {
  apiKey?: string;
  defaultCount?: number;
  timeout?: number;
}

/**
 * 执行博查搜索
 */
async function bochaWebSearch(
  params: {
    query: string;
    freshness?: string;
    count?: number;
    summary?: boolean;
  },
  config: BochaConfig,
  apiKey: string,
): Promise<string> {
  const query = params.query;
  if (!query || query.trim().length === 0) {
    throw new Error("搜索关键词 query 不能为空");
  }

  const requestBody = {
    query: query.trim(),
    freshness: params.freshness || "noLimit",
    summary: params.summary !== false,
    count: Math.min(Math.max(params.count || config.defaultCount || 5, 1), 10),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.timeout || 30000,
  );

  try {
    const response = await fetch("https://api.bochaai.com/v1/web-search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "OpenClaw-Bocha-Plugin/1.0",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`博查API请求失败 (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as BochaSearchResponse;

    if (data.code !== 200) {
      throw new Error(`博查API错误: ${data.message || "未知错误"} (code: ${data.code})`);
    }

    const results = data.data?.webPages?.value || [];

    if (results.length === 0) {
      return "未找到相关搜索结果。";
    }

    // 格式化输出
    const formatted = results
      .map((item, index) => {
        const parts = [`[${index + 1}] ${item.name}`, `URL: ${item.url}`];

        const metaParts: string[] = [];
        if (item.siteName) metaParts.push(item.siteName);
        if (item.datePublished) metaParts.push(item.datePublished);
        if (metaParts.length > 0) {
          parts.push(`来源: ${metaParts.join(" | ")}`);
        }

        const content = item.summary || item.snippet || "无摘要";
        parts.push(
          `摘要: ${content.substring(0, 300)}${content.length > 300 ? "..." : ""}`,
        );

        return parts.join("\n");
      })
      .join("\n\n");

    return `博查搜索找到 ${results.length} 条结果：\n\n${formatted}`;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("请求超时，请检查网络连接");
      }
      throw error;
    }
    throw new Error(`搜索失败: ${String(error)}`);
  }
}

/**
 * Plugin 注册函数
 */
export default function register(api: OpenClawPluginApi) {
  const config = (api.pluginConfig || {}) as BochaConfig;

  api.registerTool({
    name: "bocha_web_search",
    description:
      "使用博查AI搜索获取实时网络信息。支持中文搜索，可获取长文本摘要。适用于查找中文网页、新闻、知识等内容。",
    parameters: Type.Object({
      query: Type.String({
        description: "搜索关键词，支持自然语言查询",
      }),
      freshness: Type.Optional(
        Type.String({
          description:
            "搜索结果时间范围: oneDay(一天内), oneWeek(一周内), oneMonth(一月内), oneYear(一年内), noLimit(不限)",
          default: "noLimit",
        }),
      ),
      count: Type.Optional(
        Type.Number({
          description: "返回结果数量，范围 1-10",
          minimum: 1,
          maximum: 10,
          default: config?.defaultCount || 5,
        }),
      ),
      summary: Type.Optional(
        Type.Boolean({
          description: "是否返回长文本摘要",
          default: true,
        }),
      ),
    }),
    async execute(_id: string, args: Record<string, unknown>) {
      const apiKey = config.apiKey || process.env.BOCHA_API_KEY;
      if (!apiKey) {
        return {
          content: [
            {
              type: "text",
              text: "错误: 缺少博查 API Key。请在插件配置中设置 apiKey 或设置环境变量 BOCHA_API_KEY",
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await bochaWebSearch(
          {
            query: String(args.query || ""),
            freshness: args.freshness as string | undefined,
            count: args.count as number | undefined,
            summary: args.summary as boolean | undefined,
          },
          config,
          apiKey,
        );

        return {
          content: [{ type: "text", text: result }],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `搜索失败: ${errorMessage}` }],
          isError: true,
        };
      }
    },
  });
}
