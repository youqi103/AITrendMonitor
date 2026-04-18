import { Router, Request, Response } from "express";
import prisma from "../database.js";

const router = Router();

router.post("/monitor-keyword", async (req: Request, res: Response) => {
  try {
    const { word, scope } = req.body;
    if (!word) {
      res.status(400).json({ error: "监控词不能为空" });
      return;
    }
    const existing = await prisma.monitorTerm.findFirst({
      where: { word: word.trim() },
    });
    if (existing) {
      res.json({ id: existing.id, message: "监控词已存在", monitorTerm: existing });
      return;
    }
    const term = await prisma.monitorTerm.create({
      data: { word: word.trim(), scope: scope?.trim() || null, status: "active" },
    });
    res.status(201).json({ id: term.id, monitorTerm: term });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/monitor-keyword/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.monitorTerm.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ error: "监控词不存在" });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

router.post("/discover-trends", async (_req: Request, res: Response) => {
  try {
    const { runTrendDiscovery } = await import("../services/trend.service.js");
    const { getIO } = await import("../index.js");
    const io = getIO();
    await runTrendDiscovery(io);
    const trends = await prisma.trendItem.findMany({
      orderBy: [{ heatScore: "desc" }, { createdAt: "desc" }],
      take: 10,
      include: { news: true },
    });
    res.json({ trends });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/alerts", async (req: Request, res: Response) => {
  try {
    const { unreadOnly = "false", limit = "50" } = req.query;
    const where = unreadOnly === "true" ? { isRead: false } : {};
    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: parseInt(limit as string, 10),
      include: { monitorTerm: true, news: true },
    });
    res.json({ alerts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
