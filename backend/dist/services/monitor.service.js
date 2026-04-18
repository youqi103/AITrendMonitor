import prisma from "../database.js";
import { scrapeEastmoney, scrapeSina, scrapeTHS, scrapeXueqiu, scrape36Kr, scrapeJiemian, scrapeCe36, hashUrl, } from "./scraper/index.js";
import { verifyAuthenticity, checkRelevance, generateSummary, } from "./ai.service.js";
import { sendAlertEmail } from "./email.service.js";
export async function runScrapeAll() {
    console.log("[采集] 开始全量采集...");
    const results = await Promise.allSettled([
        scrapeEastmoney(),
        scrapeSina(),
        scrapeTHS(),
        scrapeXueqiu(),
        scrape36Kr(),
        scrapeJiemian(),
        scrapeCe36(),
    ]);
    let totalSaved = 0;
    for (const result of results) {
        if (result.status === "fulfilled" && result.value.length > 0) {
            const saved = await saveNewsItems(result.value);
            totalSaved += saved;
        }
    }
    console.log(`[采集] 完成，共保存 ${totalSaved} 条新新闻`);
    return totalSaved;
}
async function saveNewsItems(items) {
    let saved = 0;
    for (const item of items) {
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
            saved++;
        }
        catch {
            // URL 重复，跳过
        }
    }
    return saved;
}
export async function runKeywordMonitor(io) {
    console.log("[监控] 开始监控词匹配...");
    const monitorTerms = await prisma.monitorTerm.findMany({ where: { status: "active" } });
    if (monitorTerms.length === 0) {
        console.log("[监控] 无活跃监控词，跳过");
        return;
    }
    const recentNews = await prisma.newsItem.findMany({
        where: { crawledAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } },
        orderBy: { crawledAt: "desc" },
        take: 50,
    });
    if (recentNews.length === 0) {
        console.log("[监控] 无近期新闻，跳过");
        return;
    }
    let alertCount = 0;
    for (const term of monitorTerms) {
        for (const news of recentNews) {
            const existingAlert = await prisma.alert.findFirst({
                where: { monitorTermId: term.id, newsId: news.id },
            });
            if (existingAlert)
                continue;
            const titleMatch = news.title.includes(term.word);
            const contentMatch = news.content.includes(term.word);
            if (!titleMatch && !contentMatch)
                continue;
            try {
                const relevance = await checkRelevance(term.word, news.title, news.content);
                if (!relevance.isRelated || relevance.relevanceScore < 0.5)
                    continue;
                const alert = await prisma.alert.create({
                    data: {
                        monitorTermId: term.id,
                        newsId: news.id,
                        type: "keyword_match",
                        message: `[${term.word}] ${news.title} (相关度: ${(relevance.relevanceScore * 100).toFixed(0)}%, 影响: ${relevance.investmentImpact})`,
                    },
                    include: { monitorTerm: true, news: true },
                });
                io.emit("alert:new", { alert });
                alertCount++;
                const notificationSetting = await prisma.notificationSetting.findFirst({
                    where: { emailEnabled: true },
                });
                if (notificationSetting?.email) {
                    await sendAlertEmail(notificationSetting.email, {
                        message: alert.message,
                        monitorTerm: alert.monitorTerm,
                        news: alert.news,
                    });
                }
            }
            catch (error) {
                console.error(`[监控] AI 判断失败:`, error.message);
            }
        }
    }
    console.log(`[监控] 完成，新增 ${alertCount} 条告警`);
}
export async function runVerifyNews() {
    console.log("[验证] 开始 AI 内容验证...");
    const unverified = await prisma.newsItem.findMany({
        where: { isVerified: false },
        orderBy: { crawledAt: "desc" },
        take: 10,
    });
    for (const news of unverified) {
        try {
            const result = await verifyAuthenticity(news.title, news.content, news.source);
            const summary = await generateSummary(news.title, news.content);
            await prisma.newsItem.update({
                where: { id: news.id },
                data: {
                    isVerified: result.isAuthentic,
                    sentiment: result.riskLevel === "high"
                        ? "negative"
                        : result.riskLevel === "low"
                            ? "positive"
                            : "neutral",
                    aiSummary: summary,
                },
            });
        }
        catch (error) {
            console.error(`[验证] 新闻 ${news.id} 验证失败:`, error.message);
        }
    }
    console.log(`[验证] 完成，验证 ${unverified.length} 条新闻`);
}
//# sourceMappingURL=monitor.service.js.map