import OpenAI from "openai";
import { config } from "../config.js";
import type {
  AIAuthenticityResult,
  AIRelevanceResult,
  AITrendResult,
} from "../types/index.js";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: config.openrouter.apiKey,
  defaultHeaders: {
    "HTTP-Referer": config.frontendUrl,
    "X-OpenRouter-Title": "AI Trend Monitor",
  },
});

function cleanJSONResponse(response: string): string {
  // 移除Markdown代码块标记
  const cleaned = response
    .replace(/^```json\n/, "")
    .replace(/```$/g, "")
    .trim();
  return cleaned || "{}";
}

async function callAI(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: config.openrouter.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: config.openrouter.temperature,
    max_tokens: config.openrouter.maxTokens,
    response_format: { type: "json_object" },
  });
  const content = completion.choices[0]?.message?.content || "{}";
  return cleanJSONResponse(content);
}

export async function verifyAuthenticity(
  title: string,
  content: string,
  source: string,
): Promise<AIAuthenticityResult> {
  const systemPrompt = `你是一位专业的财经信息验证分析师。请分析以下新闻内容，判断其真实性。

判断标准：
1. 信息来源是否可靠
2. 内容是否存在明显的事实错误
3. 是否有其他来源可以佐证
4. 是否存在夸大或误导性表述

请以 JSON 格式返回：
{
  "isAuthentic": boolean,
  "confidence": number,
  "reason": string,
  "riskLevel": "low" | "medium" | "high"
}`;

  const userPrompt = `新闻标题：${title}\n新闻内容：${content}\n来源：${source}`;
  const result = await callAI(systemPrompt, userPrompt);
  return JSON.parse(result) as AIAuthenticityResult;
}

export async function checkRelevance(
  keyword: string,
  title: string,
  content: string,
): Promise<AIRelevanceResult> {
  const systemPrompt = `你是一位专业的财经信息匹配分析师。请判断以下新闻是否与监控关键词真正相关。

判断标准：
1. 新闻核心内容是否直接涉及该关键词
2. 是否只是偶然提及（如出现在无关列表中）
3. 对投资者是否有实际参考价值

请以 JSON 格式返回：
{
  "isRelated": boolean,
  "relevanceScore": number,
  "reason": string,
  "investmentImpact": "positive" | "negative" | "neutral" | "none"
}`;

  const userPrompt = `关键词：${keyword}\n新闻标题：${title}\n新闻内容：${content}`;
  const result = await callAI(systemPrompt, userPrompt);
  return JSON.parse(result) as AIRelevanceResult;
}

export async function extractTrends(newsList: string): Promise<AITrendResult> {
  const systemPrompt = `你是一位专业的财经分析师。请从以下新闻列表中提取当前市场热点。

要求：
1. 识别最重要的 3-5 个热点主题
2. 每个热点给出简短摘要
3. 评估热度的 1-100 分
4. 判断情感倾向（利好/利空/中性）
5. 分类必须从以下选项中选择：科技、金融、医疗、能源、教育、政策

请以 JSON 格式返回：
{
  "trends": [
    {
      "title": string,
      "summary": string,
      "heatScore": number,
      "sentiment": "positive" | "negative" | "neutral",
      "category": string
    }
  ]
}`;

  const userPrompt = `新闻列表：\n${newsList}`;
  const result = await callAI(systemPrompt, userPrompt);
  return JSON.parse(result) as AITrendResult;
}

export async function generateSummary(
  title: string,
  content: string,
): Promise<string> {
  const systemPrompt =
    "你是一位专业的财经编辑。请用 1-2 句话概括以下新闻的核心内容，突出对股市的影响。";
  const userPrompt = `标题：${title}\n内容：${content}`;
  const result = await callAI(systemPrompt, userPrompt);
  try {
    const parsed = JSON.parse(result);
    return parsed.summary || parsed.content || result;
  } catch {
    return result;
  }
}

export async function expandQuery(query: string): Promise<string[]> {
  const systemPrompt = `你是一位专业的财经搜索分析师。用户输入了一个监控关键词，请生成相关的搜索扩展词。

要求：
1. 生成 3-7 个相关扩展词
2. 扩展词应该覆盖同义词、相关概念、上下游领域等
3. 扩展词应该能帮助发现更多相关新闻

请以 JSON 格式返回：
{
  "expandedQueries": ["扩展词1", "扩展词2", "扩展词3"]
}`;

  const userPrompt = `监控关键词：${query}`;
  const result = await callAI(systemPrompt, userPrompt);
  try {
    const parsed = JSON.parse(result);
    return [query, ...(parsed.expandedQueries || [])];
  } catch {
    return [query];
  }
}

export async function aggregateSummaries(
  newsList: Array<{ title: string; content: string; source: string }>
): Promise<string> {
  const systemPrompt = `你是一位专业的财经分析师。请对以下多条相关新闻进行聚合分析，生成一个综合摘要。

要求：
1. 提取多条新闻的共同主题
2. 指出不同来源报道的差异
3. 给出对投资决策的参考建议
4. 摘要长度 100-200 字

请以 JSON 格式返回：
{
  "summary": "综合摘要内容",
  "mainTheme": "主要主题",
  "sentiment": "利好/利空/中性",
  "investmentAdvice": "投资建议"
}`;

  const newsText = newsList
    .map((n, i) => `[${i + 1}] 来源：${n.source}\n标题：${n.title}\n内容：${n.content}`)
    .join("\n\n");

  const userPrompt = `新闻列表：\n${newsText}`;
  const result = await callAI(systemPrompt, userPrompt);
  try {
    const parsed = JSON.parse(result);
    return parsed.summary || result;
  } catch {
    return result;
  }
}
