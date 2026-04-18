import { Router, Request, Response } from "express";
import prisma from "../database.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const limit = parseInt((req.query.limit as string) || "20", 10);
    const offset = parseInt((req.query.offset as string) || "0", 10);
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
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const trend = await prisma.trendItem.findUnique({
      where: { id },
      include: { news: true },
    });
    if (!trend) {
      res.status(404).json({ error: "热点不存在" });
      return;
    }
    res.json(trend);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
