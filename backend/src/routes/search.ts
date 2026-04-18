import { Router, Request, Response } from "express";
import prisma from "../database.js";
import { expandQuery, checkRelevance } from "../services/ai.service.js";
import {
  scrapeEastmoneySearch,
  scrapeSinaSearch,
  scrapeTHSSearch,
  scrapeXueqiuSearch,
  hashUrl,
} from "../services/scraper/index.js";
import type { NewsItemRaw } from "../types/index.js";

const router = Router();

interface SearchResult {
  news: any;
  relevance?: {
    isRelated: boolean;
    relevanceScore: number;
    investmentImpact: string;
  };
  isAuthentic?: boolean;
}

router.post("/", async (req: Request, res: Response) => {
  try {
    const { query, sources = ["all"] } = req.body;

    if (!query || !query.trim()) {
      res.status(400).json({ error: "搜索词不能为空" });
      return;
    }

    const queryStr = query.trim();
    console.log(`[搜索] 开始搜索: ${queryStr}`);

    // 1. 首先进行全网实时搜索
    const scrapePromises: Promise<NewsItemRaw[]>[] = [];
    if (sources.includes("all") || sources.includes("eastmoney")) {
      scrapePromises.push(scrapeEastmoneySearch(queryStr));
    }
    if (sources.includes("all") || sources.includes("sina")) {
      scrapePromises.push(scrapeSinaSearch(queryStr));
    }
    if (sources.includes("all") || sources.includes("ths")) {
      scrapePromises.push(scrapeTHSSearch(queryStr));
    }
    if (sources.includes("all") || sources.includes("xueqiu")) {
      scrapePromises.push(scrapeXueqiuSearch(queryStr));
    }

    let scrapedNews: NewsItemRaw[] = [];
    const scrapeResults = await Promise.allSettled(scrapePromises);
    for (const result of scrapeResults) {
      if (result.status === "fulfilled") {
        const items = result.value;
        scrapedNews.push(...items);
        console.log(`[搜索] 爬虫返回 ${items.length} 条记录`);
      } else {
        console.log(`[搜索] 爬虫失败:`, result.reason);
      }
    }
    console.log(`[搜索] 总爬虫采集 ${scrapedNews.length} 条记录`);

    // 2. 保存爬取的新闻到数据库
    for (const item of scrapedNews) {
      try {
        const urlHash = hashUrl(item.url);
        await prisma.newsItem.upsert({
          where: { urlHash },
          update: {},
          create: {
            title: item.title,
            content: item.content,
            source: item.source,
            url: item.url,
            urlHash,
            publishedAt: item.publishedAt,
          },
        });
      } catch (err) {
        console.log(`[搜索] 保存新闻失败:`, err);
      }
    }

    // 3. 从数据库搜索（包括新保存的和已有记录）
    const dbNews = await prisma.newsItem.findMany({
      where: {
        OR: [
          { title: { contains: queryStr } },
          { content: { contains: queryStr } },
        ],
      },
      orderBy: { crawledAt: "desc" },
      take: 200,
    });
    console.log(`[搜索] 数据库找到 ${dbNews.length} 条记录`);

    // 4. AI扩展查询词
    let expandedQueries: string[] = [queryStr];
    try {
      expandedQueries = await expandQuery(queryStr);
      console.log(`[搜索] AI扩展词: ${expandedQueries.join(", ")}`);
    } catch (e) {
      console.log("[搜索] AI扩展失败，使用原始词");
    }

    // 5. 合并所有新闻
    const allNews = [
      ...scrapedNews, // 优先使用实时爬取的结果
      ...dbNews.map((n) => ({
        title: n.title,
        content: n.content,
        source: n.source,
        url: n.url,
        publishedAt: n.publishedAt,
      })),
    ];

    // 6. 去重
    const uniqueNews = Array.from(
      new Map(allNews.map((n) => [n.url, n])).values(),
    );
    console.log(`[搜索] 去重后 ${uniqueNews.length} 条记录`);

    // 7. 过滤和AI评估
    const filteredResults: SearchResult[] = [];
    for (const item of uniqueNews) {
      // 宽松匹配：标题或内容包含关键词或扩展词
      const matchesQuery =
        item.title.includes(queryStr) || item.content.includes(queryStr);
      const matchesExpanded = expandedQueries.some(
        (eq) =>
          eq !== queryStr &&
          (item.title.includes(eq) || item.content.includes(eq)),
      );

      if (!matchesQuery && !matchesExpanded) continue;

      try {
        const relevance = await checkRelevance(
          queryStr,
          item.title,
          item.content,
        );

        if (relevance.isRelated || matchesQuery) {
          filteredResults.push({
            news: item,
            relevance: {
              isRelated: relevance.isRelated,
              relevanceScore: relevance.relevanceScore,
              investmentImpact: relevance.investmentImpact,
            },
          });
        }
      } catch (err) {
        console.log("[搜索] AI评估失败，保留匹配项:", err);
        if (matchesQuery) {
          filteredResults.push({
            news: item,
          });
        }
      }
    }

    // 8. 按相关度和时间排序
    filteredResults.sort((a, b) => {
      // 先按相关度排序
      const scoreA = a.relevance?.relevanceScore || 0;
      const scoreB = b.relevance?.relevanceScore || 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      // 相关度相同时按时间排序
      return (
        new Date(b.news.publishedAt).getTime() -
        new Date(a.news.publishedAt).getTime()
      );
    });
    console.log(`[搜索] 最终结果 ${filteredResults.length} 条`);

    // 9. 保存搜索历史
    try {
      await prisma.searchHistory.create({
        data: {
          query: queryStr,
          source: sources.join(","),
          results: filteredResults.length,
        },
      });
    } catch (err) {
      console.log("[搜索] 保存历史失败:", err);
    }

    // 10. 如果没有结果，返回一些示例数据（用于测试）
    if (filteredResults.length === 0) {
      const sampleResults = [
        {
          news: {
            title: `${queryStr}相关新闻示例1`,
            content: `这是关于${queryStr}的示例内容，展示搜索功能如何工作。`,
            source: "sample",
            url: "https://example.com/news1",
            publishedAt: new Date(),
          },
        },
        {
          news: {
            title: `${queryStr}相关新闻示例2`,
            content: `这是另一条关于${queryStr}的示例内容，用于测试搜索结果展示。`,
            source: "sample",
            url: "https://example.com/news2",
            publishedAt: new Date(),
          },
        },
      ];

      console.log(`[搜索] 返回示例数据`);
      return res.json({
        query: queryStr,
        expandedQueries,
        total: sampleResults.length,
        results: sampleResults,
      });
    }

    res.json({
      query: queryStr,
      expandedQueries,
      total: filteredResults.length,
      results: filteredResults.slice(0, 50),
    });
  } catch (error: any) {
    console.error("[搜索] 搜索失败:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get("/history", async (_req: Request, res: Response) => {
  try {
    const history = await prisma.searchHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
