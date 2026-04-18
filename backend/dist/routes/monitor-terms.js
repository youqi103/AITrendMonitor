import { Router } from "express";
import prisma from "../database.js";
const router = Router();
router.get("/", async (_req, res) => {
    try {
        const terms = await prisma.monitorTerm.findMany({
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { alerts: true } } },
        });
        res.json(terms);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post("/", async (req, res) => {
    try {
        const { word, scope } = req.body;
        if (!word || !word.trim()) {
            res.status(400).json({ error: "监控词不能为空" });
            return;
        }
        const existing = await prisma.monitorTerm.findFirst({
            where: { word: word.trim() },
        });
        if (existing) {
            res.status(409).json({ error: "监控词已存在" });
            return;
        }
        const term = await prisma.monitorTerm.create({
            data: { word: word.trim(), scope: scope?.trim() || null, status: "active" },
        });
        res.status(201).json(term);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { word, scope, status } = req.body;
        const data = {};
        if (word !== undefined)
            data.word = word.trim();
        if (scope !== undefined)
            data.scope = scope?.trim() || null;
        if (status !== undefined)
            data.status = status;
        const term = await prisma.monitorTerm.update({
            where: { id },
            data,
        });
        res.json(term);
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({ error: "监控词不存在" });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
router.patch("/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!["active", "paused"].includes(status)) {
            res.status(400).json({ error: "状态必须是 active 或 paused" });
            return;
        }
        const term = await prisma.monitorTerm.update({
            where: { id },
            data: { status },
        });
        res.json(term);
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({ error: "监控词不存在" });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.monitorTerm.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({ error: "监控词不存在" });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=monitor-terms.js.map