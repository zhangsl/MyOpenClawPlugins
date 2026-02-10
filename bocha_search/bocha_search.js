/**
 * 博查AI搜索工具 - OpenClaw 自定义工具
 * 文档: https://bocha-ai.feishu.cn/wiki/RXEOw02rFiwzGSkd9mUcqoeAnNK
 * API: https://api.bochaai.com/v1/web-search
 */

const https = require('https');

/**
 * 执行博查搜索
 * @param {Object} params - 搜索参数
 * @param {string} params.query - 搜索关键词（必填）
 * @param {string} params.freshness - 时间范围: oneDay, oneWeek, oneMonth, oneYear, noLimit（默认 oneWeek）
 * @param {number} params.count - 返回结果数量 1-10（默认 5）
 * @param {boolean} params.summary - 是否返回长文本摘要（默认 true）
 */
async function bochaWebSearch(params) {
  const apiKey = "";
  
  if (!apiKey) {
    throw new Error('环境变量 BOCHA_API_KEY 未设置，请先设置博查 API Key');
  }

  const query = params.query || params.q;
  if (!query) {
    throw new Error('搜索关键词 query 不能为空');
  }

  // 构建请求体
  const requestBody = {
    query: query,
    freshness: params.freshness || 'noLimit',
    summary: params.summary !== false, // 默认开启长摘要
    count: Math.min(Math.max(params.count || 5, 1), 10) // 限制 1-10
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(requestBody);
    
    const options = {
      hostname: 'api.bochaai.com',
      port: 443,
      path: '/v1/web-search',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'OpenClaw-Bocha-Tool/1.0'
      },
      timeout: 30000 // 30秒超时
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.code !== 200) {
            reject(new Error(`博查API错误: ${response.message || '未知错误'} (code: ${response.code})`));
            return;
          }

          // 格式化结果为 OpenClaw 友好格式
          const results = response.data?.webPages?.value || [];
          
          if (results.length === 0) {
            resolve('未找到相关搜索结果。');
            return;
          }

          // 构建格式化输出
          const formatted = results.map((item, index) => {
            const parts = [
              `[${index + 1}] ${item.name}`,
              `URL: ${item.url}`,
              `来源: ${item.siteName || '未知'}${item.datePublished ? ` | ${item.datePublished}` : ''}`
            ];
            
            // 优先使用长摘要，否则使用简短摘要
            const content = item.summary || item.snippet || '无摘要';
            parts.push(`摘要: ${content.substring(0, 300)}${content.length > 300 ? '...' : ''}`);
            
            return parts.join('\n');
          }).join('\n\n');

          const summary = `博查搜索找到 ${results.length} 条结果：\n\n${formatted}`;
          resolve(summary);
          
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`请求失败: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时，请检查网络连接'));
    });

    req.write(postData);
    req.end();
  });
}

// OpenClaw 工具导出格式
module.exports = {
  name: 'bocha_web_search',
  description: '使用博查AI搜索获取实时网络信息。支持中文搜索，可获取长文本摘要。',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词，支持自然语言查询'
      },
      freshness: {
        type: 'string',
        enum: ['oneDay', 'oneWeek', 'oneMonth', 'oneYear', 'noLimit'],
        description: '搜索结果时间范围，默认 noLimit（不限）',
        default: 'noLimit'
      },
      count: {
        type: 'number',
        description: '返回结果数量，范围 1-10，默认 5',
        default: 5,
        minimum: 1,
        maximum: 10
      },
      summary: {
        type: 'boolean',
        description: '是否返回长文本摘要，默认 true',
        default: true
      }
    },
    required: ['query']
  },
  
  // 主处理函数
  handler: async (params) => {
    try {
      const result = await bochaWebSearch(params);
      return {
        content: result,
        type: 'text'
      };
    } catch (error) {
      return {
        content: `搜索失败: ${error.message}`,
        type: 'error'
      };
    }
  }
};
