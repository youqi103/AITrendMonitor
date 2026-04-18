import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "./config.js";
import prisma from "./database.js";
import { initScheduler, runInitialTasks } from "./scheduler.js";
import { initEmailTransporter } from "./services/email.service.js";
import monitorTermsRouter from "./routes/monitor-terms.js";
import trendsRouter from "./routes/trends.js";
import alertsRouter from "./routes/alerts.js";
import settingsRouter from "./routes/settings.js";
import skillsRouter from "./routes/skills.js";
import searchRouter from "./routes/search.js";
import notificationRouter from "./routes/notification.js";
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: config.frontendUrl,
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());
app.use("/api/monitor-terms", monitorTermsRouter);
app.use("/api/trends", trendsRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/search", searchRouter);
app.use("/api/notification", notificationRouter);
app.get("/api/status", (_req, res) => {
    res.json({
        status: "running",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        config: {
            aiModel: config.openrouter.model,
            scrapeIntervalFast: config.scrape.intervalFast,
            scrapeIntervalSlow: config.scrape.intervalSlow,
            trendDiscoveryInterval: config.scrape.trendDiscoveryInterval,
        },
    });
});
app.get("/api/dashboard/stats", async (_req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalTrends, todayTrends, urgentAlerts, monitorTerms] = await Promise.all([
            prisma.trendItem.count(),
            prisma.trendItem.count({ where: { createdAt: { gte: today } } }),
            prisma.alert.count({ where: { isRead: false, createdAt: { gte: today } } }),
            prisma.monitorTerm.count({ where: { status: "active" } }),
        ]);
        const latestTrends = await prisma.trendItem.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { news: true },
        });
        res.json({
            totalTrends,
            todayTrends,
            urgentAlerts,
            monitorTerms,
            latestTrends,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
io.on("connection", (socket) => {
    console.log(`[Socket] 客户端连接: ${socket.id}`);
    socket.emit("system:status", { status: "connected" });
    socket.on("keyword:subscribe", (data) => {
        socket.join(`keyword:${data.keywordId}`);
        console.log(`[Socket] ${socket.id} 订阅关键词: ${data.keywordId}`);
    });
    socket.on("keyword:unsubscribe", (data) => {
        socket.leave(`keyword:${data.keywordId}`);
        console.log(`[Socket] ${socket.id} 取消订阅关键词: ${data.keywordId}`);
    });
    socket.on("disconnect", () => {
        console.log(`[Socket] 客户端断开: ${socket.id}`);
    });
});
export function getIO() {
    return io;
}
async function main() {
    console.log("🚀 AI Trend Monitor 启动中...");
    await prisma.$connect();
    console.log("✅ 数据库连接成功");
    initEmailTransporter();
    initScheduler(io);
    httpServer.listen(config.port, () => {
        console.log(`✅ 服务运行在 http://localhost:${config.port}`);
        console.log(`📡 Socket.IO 已启用`);
        console.log(`🤖 AI 模型: ${config.openrouter.model}`);
    });
    // 延迟 5 秒后执行首次采集，确保服务完全就绪
    setTimeout(() => {
        runInitialTasks(io).catch((err) => console.error("[初始化] 首次采集失败:", err.message));
    }, 5000);
}
main().catch((err) => {
    console.error("❌ 启动失败:", err);
    process.exit(1);
});
process.on("SIGINT", async () => {
    console.log("\n🛑 正在关闭...");
    await prisma.$disconnect();
    httpServer.close();
    process.exit(0);
});
//# sourceMappingURL=index.js.map