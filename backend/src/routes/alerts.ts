import { Router, Request, Response } from "express";
import prisma from "../database.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const unreadOnly = (req.query.unreadOnly as string) || "false";
    const limit = parseInt((req.query.limit as string) || "50", 10);
    const offset = parseInt((req.query.offset as string) || "0", 10);
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
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put("/:id/read", async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const alert = await prisma.alert.update({
      where: { id },
      data: { isRead: true },
    });
    res.json(alert);
  } catch (error: unknown) {
    if ((error as any).code === "P2025") {
      res.status(404).json({ error: "通知不存在" });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put("/read-all", async (_req: Request, res: Response) => {
  try {
    await prisma.alert.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
