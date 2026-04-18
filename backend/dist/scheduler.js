import cron from "node-cron";
import { config } from "./config.js";
import { runScrapeAll, runKeywordMonitor, runVerifyNews, } from "./services/monitor.service.js";
import { runTrendDiscovery } from "./services/trend.service.js";
let ioInstance = null;
export function initScheduler(io) {
    ioInstance = io;
    const fastInterval = `*/${config.scrape.intervalFast} * * * *`;
    const slowInterval = `*/${config.scrape.intervalSlow} * * * *`;
    const trendInterval = `*/${config.scrape.trendDiscoveryInterval} * * * *`;
    // 快速采集 - 东方财富 + 新浪
    cron.schedule(fastInterval, async () => {
        console.log(`[定时] 快速采集触发 (${new Date().toLocaleTimeString()})`);
        await runScrapeAll();
        if (ioInstance)
            await runKeywordMonitor(ioInstance);
    });
    // 慢速采集 - 同花顺 + 雪球（通过 runScrapeAll 内部并行处理）
    cron.schedule(slowInterval, async () => {
        console.log(`[定时] 慢速采集触发 (${new Date().toLocaleTimeString()})`);
    });
    // AI 内容验证
    cron.schedule("*/15 * * * *", async () => {
        if (ioInstance)
            await runVerifyNews();
    });
    // 热点发现
    cron.schedule(trendInterval, async () => {
        if (ioInstance)
            await runTrendDiscovery(ioInstance);
    });
    console.log("[定时] 任务调度器已启动");
    console.log(`  快速采集: 每 ${config.scrape.intervalFast} 分钟`);
    console.log(`  慢速采集: 每 ${config.scrape.intervalSlow} 分钟`);
    console.log(`  热点发现: 每 ${config.scrape.trendDiscoveryInterval} 分钟`);
}
export async function runInitialTasks(io) {
    console.log("[初始化] 执行首次采集...");
    await runScrapeAll();
    await runKeywordMonitor(io);
    await runVerifyNews();
    await runTrendDiscovery(io);
    console.log("[初始化] 首次采集完成");
}
//# sourceMappingURL=scheduler.js.map