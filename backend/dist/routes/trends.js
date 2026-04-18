import { Router } from "express";
import prisma from "../database.js";
const router = Router();
router.get("/", async (req, res) => {
    try {
        const category = req.query.category;
        const limit = parseInt(req.query.limit || "20", 10);
        const offset = parseInt(req.query.offset || "0", 10);
        const where = category ? { category } : {};
        const trends = await prisma.trendItem.findMany({
            where,
            orderBy: [{ heatScore: "desc" }, { createdAt: "desc" }],
            take: limit,
            skip: offset,
            include: { news: true },
        });
        const total = await prisma.trendItem.count({ where });
        res.json({ trends, total });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const trend = await prisma.trendItem.findUnique({
            where: { id },
            include: { news: true },
        });
        if (!trend) {
            res.status(404).json({ error: "热点不存在" });
            return;
        }
        res.json(trend);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=trends.js.map