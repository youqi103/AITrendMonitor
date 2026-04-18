import { Router } from "express";
import prisma from "../database.js";
const router = Router();
router.get("/", async (_req, res) => {
    try {
        const settings = await prisma.setting.findMany();
        const result = {};
        settings.forEach((s) => {
            result[s.key] = s.value;
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put("/", async (req, res) => {
    try {
        const updates = req.body;
        const operations = Object.entries(updates).map(([key, value]) => prisma.setting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        }));
        await prisma.$transaction(operations);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=settings.js.map