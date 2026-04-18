import { Router } from "express";
import prisma from "../database.js";
const router = Router();
router.get("/", async (_req, res) => {
    try {
        let setting = await prisma.notificationSetting.findFirst();
        if (!setting) {
            setting = await prisma.notificationSetting.create({
                data: { websocketEnabled: true },
            });
        }
        res.json(setting);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put("/", async (req, res) => {
    try {
        const { email, emailEnabled, websocketEnabled } = req.body;
        let setting = await prisma.notificationSetting.findFirst();
        const data = {};
        if (email !== undefined)
            data.email = email || null;
        if (emailEnabled !== undefined)
            data.emailEnabled = emailEnabled;
        if (websocketEnabled !== undefined)
            data.websocketEnabled = websocketEnabled;
        if (setting) {
            setting = await prisma.notificationSetting.update({
                where: { id: setting.id },
                data,
            });
        }
        else {
            setting = await prisma.notificationSetting.create({
                data: {
                    email: email || null,
                    emailEnabled: emailEnabled ?? false,
                    websocketEnabled: websocketEnabled ?? true,
                },
            });
        }
        res.json(setting);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=notification.js.map