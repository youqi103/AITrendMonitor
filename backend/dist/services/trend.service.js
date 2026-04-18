import prisma from "../database.js";
import { extractTrends } from "./ai.service.js";
export async function runTrendDiscovery(io) {
    console.log("[热点] 开始热点发现...");
    const recentNews = await prisma.newsItem.findMany({
        where: { crawledAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
        orderBy: { crawledAt: "desc" },
        take: 30,
    });
    if (recentNews.length === 0) {
        console.log("[热点] 无近期新闻，跳过");
        return;
    }
    const newsList = recentNews
        .map((n, i) => `${i + 1}. [${n.source}] ${n.title}: ${n.content.substring(0, 100)}`)
        .join("\n");
    try {
        const result = await extractTrends(newsList);
        if (!result.trends || result.trends.length === 0) {
            console.log("[热点] 未发现新热点");
            return;
        }
        for (const trend of result.trends) {
            const existing = await prisma.trendItem.findFirst({
                where: { title: trend.title },
                orderBy: { createdAt: "desc" },
            });
            if (existing) {
                if (existing.heatScore !== trend.heatScore) {
                    await prisma.trendItem.update({
                        where: { id: existing.id },
                        data: { heatScore: trend.heatScore },
                    });
                }
                continue;
            }
            const relatedNews = recentNews.find((n) => n.title.includes(trend.title.substring(0, 4)) ||
                n.content.includes(trend.title.substring(0, 4)));
            await prisma.trendItem.create({
                data: {
                    title: trend.title,
                    summary: trend.summary,
                    heatScore: trend.heatScore,
                    category: trend.category,
                    newsId: relatedNews?.id || null,
                },
            });
        }
        const latestTrends = await prisma.trendItem.findMany({
            orderBy: [{ heatScore: "desc" }, { createdAt: "desc" }],
            take: 10,
            include: { news: true },
        });
        io.emit("trend:update", { trends: latestTrends });
        console.log(`[热点] 发现 ${result.trends.length} 个热点`);
    }
    catch (error) {
        console.error("[热点] 发现失败:", error.message);
    }
}
//# sourceMappingURL=trend.service.js.map