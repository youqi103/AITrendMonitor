import { Router } from "express";
import prisma from "../database.js";
const router = Router();
router.get("/", async (_req, res) => {
    try {
        const keywords = await prisma.keyword.findMany({
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { alerts: true } } },
        });
        res.json(keywords);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post("/", async (req, res) => {
    try {
        const { word, scope } = req.body;
        if (!word || !word.trim()) {
            res.status(400).json({ error: "关键词不能为空" });
            return;
        }
        const existing = await prisma.keyword.findFirst({
            where: { word: word.trim() },
        });
        if (existing) {
            res.status(409).json({ error: "关键词已存在" });
            return;
        }
        const keyword = await prisma.keyword.create({
            data: { word: word.trim(), scope: scope?.trim() || null },
        });
        res.status(201).json(keyword);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { word, scope, isActive } = req.body;
        const keyword = await prisma.keyword.update({
            where: { id },
            data: {
                ...(word !== undefined && { word: word.trim() }),
                ...(scope !== undefined && { scope: scope?.trim() || null }),
                ...(isActive !== undefined && { isActive }),
            },
        });
        res.json(keyword);
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({ error: "关键词不存在" });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.keyword.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({ error: "关键词不存在" });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=keywords.js.map