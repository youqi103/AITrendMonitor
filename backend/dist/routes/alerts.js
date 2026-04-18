import { Router } from "express";
import prisma from "../database.js";
const router = Router();
router.get("/", async (req, res) => {
    try {
        const unreadOnly = req.query.unreadOnly || "false";
        const limit = parseInt(req.query.limit || "50", 10);
        const offset = parseInt(req.query.offset || "0", 10);
        const where = unreadOnly === "true" ? { isRead: false } : {};
        const alerts = await prisma.alert.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
            include: { monitorTerm: true, news: true },
        });
        const unreadCount = await prisma.alert.count({ where: { isRead: false } });
        res.json({ alerts, unreadCount });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put("/:id/read", async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await prisma.alert.update({
            where: { id },
            data: { isRead: true },
        });
        res.json(alert);
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({ error: "通知不存在" });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
router.put("/read-all", async (_req, res) => {
    try {
        await prisma.alert.updateMany({
            where: { isRead: false },
            data: { isRead: true },
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=alerts.js.map