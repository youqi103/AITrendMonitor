import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    model: process.env.AI_MODEL || "deepseek/deepseek-chat-v3-0324",
    temperature: parseFloat(process.env.AI_TEMPERATURE || "0.3"),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || "1024", 10),
  },
  scrape: {
    intervalFast: parseInt(process.env.SCRAPE_INTERVAL_FAST || "5", 10),
    intervalSlow: parseInt(process.env.SCRAPE_INTERVAL_SLOW || "10", 10),
    trendDiscoveryInterval: parseInt(
      process.env.TREND_DISCOVERY_INTERVAL || "30",
      10,
    ),
  },
  email: {
    enabled: process.env.EMAIL_ENABLED === "true",
    host: process.env.EMAIL_HOST || "",
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    from: process.env.EMAIL_FROM || "",
  },
};
