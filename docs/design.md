# AI Trend Monitor — 技术方案文档

## 1. 整体架构

```
┌──────────────────────────────────────────────────────┐
│              前端 (React + Vite + Tailwind)           │
│         赛博交易终端风格 · 响应式 · Socket.IO Client    │
└─────────────────────────┬────────────────────────────┘
                          │ REST API + WebSocket
┌─────────────────────────▼────────────────────────────┐
│              后端 (Node.js + Express)                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │  关键词监控    │ │  热点发现     │ │ Skills API   │  │
│  │  Router       │ │  Router      │ │  Router      │  │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘  │
│  ┌──────▼────────────────▼────────────────▼───────┐  │
│  │            Service 层                           │  │
│  │  MonitorService · TrendService · AlertService   │  │
│  └───────────────────┬────────────────────────────┘  │
│  ┌───────────────────▼────────────────────────────┐  │
│  │           AI 服务层 (OpenRouter)                │  │
│  │   内容真伪识别 · 热点提取 · 相关性判断 · 摘要生成  │  │
│  └───────────────────┬────────────────────────────┘  │
│  ┌───────────────────▼────────────────────────────┐  │
│  │           数据采集层 (Scraper)                   │  │
│  │   东方财富 · 新浪财经 · 同花顺 · 雪球             │  │
│  └───────────────────┬────────────────────────────┘  │
│  ┌───────────────────▼────────────────────────────┐  │
│  │  Prisma ORM + SQLite · node-cron 定时任务       │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

## 2. 技术选型

| 层级 | 技术 | 版本 | 理由 |
|------|------|------|------|
| 后端框架 | **Express** | 5.x | 轻量、生态丰富、用户指定 |
| 数据库 ORM | **Prisma** | 6.x | 类型安全、自动迁移、用户指定 |
| 数据库 | **SQLite** | * | 零配置、单文件、够用 |
| 实时通讯 | **Socket.IO** | 4.x | 双向实时推送、用户指定 |
| 定时任务 | **node-cron** | 3.x | 轻量级 Cron 表达式调度 |
| AI 服务 | **OpenRouter API** | v1 | 统一接入多模型、用户指定 |
| HTTP 客户端 | **axios** | 1.x | 数据采集、API 调用 |
| HTML 解析 | **cheerio** | 1.x | 轻量级 jQuery 风格 HTML 解析 |
| 前端框架 | **React** | 19.x | 组件化、生态丰富 |
| 构建工具 | **Vite** | 6.x | 快速 HMR、用户指定 |
| CSS 框架 | **Tailwind CSS** | 4.x | 原子化 CSS、快速开发 |
| Socket.IO Client | **socket.io-client** | 4.x | 与后端 Socket.IO 配对 |

## 3. 数据库设计（Prisma Schema）

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 用户监控的关键词
model Keyword {
  id        String   @id @default(cuid())
  word      String                    // 监控关键词
  scope     String?                   // 关注范围（如"地缘政治"）
  isActive  Boolean  @default(true)   // 是否启用
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  alerts    Alert[]                   // 关联的通知记录
}

// 采集到的新闻/资讯
model NewsItem {
  id        String   @id @default(cuid())
  title     String                    // 标题
  content   String                    // 正文摘要
  source    String                    // 来源（eastmoney/sina/ths/xueqiu）
  url       String                    // 原文链接
  publishedAt DateTime               // 发布时间
  crawledAt DateTime  @default(now()) // 采集时间
  aiSummary String?                  // AI 生成的摘要
  isVerified Boolean  @default(false) // AI 是否验证为真实
  sentiment String?                  // 情感倾向（positive/negative/neutral）
  trends    TrendItem[]              // 关联的热点
}

// 通知/告警记录
model Alert {
  id        String   @id @default(cuid())
  keywordId String
  keyword   Keyword  @relation(fields: [keywordId], references: [id])
  newsId    String
  news      NewsItem @relation(fields: [newsId], references: [id])
  type      String                    // alert 类型：keyword_match / trend_spike
  message   String                    // 通知内容
  isRead    Boolean  @default(false)  // 是否已读
  createdAt DateTime @default(now())
}

// 热点条目
model TrendItem {
  id        String   @id @default(cuid())
  title     String                    // 热点标题
  summary   String                    // 热点摘要
  heatScore Int      @default(0)      // 热度分数
  category  String?                   // 分类
  newsId    String?                   // 关联新闻
  news      NewsItem? @relation(fields: [newsId], references: [id])
  createdAt DateTime @default(now())
}

// 系统配置
model Setting {
  id    String @id @default(cuid())
  key   String @unique               // 配置键
  value String                       // 配置值
}
```

## 4. API 设计

### 4.1 关键词监控 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/keywords` | 获取所有关键词 |
| POST | `/api/keywords` | 添加关键词 |
| PUT | `/api/keywords/:id` | 更新关键词 |
| DELETE | `/api/keywords/:id` | 删除关键词 |

### 4.2 热点发现 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/trends` | 获取热点列表（支持分页、分类筛选） |
| GET | `/api/trends/:id` | 获取热点详情 |

### 4.3 通知 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/alerts` | 获取通知列表（支持未读筛选） |
| PUT | `/api/alerts/:id/read` | 标记已读 |
| PUT | `/api/alerts/read-all` | 全部标记已读 |

### 4.4 系统 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings` | 获取系统配置 |
| PUT | `/api/settings` | 更新系统配置 |
| GET | `/api/status` | 获取系统运行状态 |

### 4.5 Agent Skills API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/skills/monitor-keyword` | 添加关键词监控 |
| POST | `/api/skills/discover-trends` | 触发热点发现 |
| GET | `/api/skills/alerts` | 获取告警列表 |
| DELETE | `/api/skills/monitor-keyword/:id` | 移除关键词监控 |

## 5. Socket.IO 事件设计

### 5.1 服务端 → 客户端

| 事件名 | 数据格式 | 说明 |
|--------|----------|------|
| `alert:new` | `{ alert: Alert }` | 新告警通知 |
| `trend:update` | `{ trends: TrendItem[] }` | 热点更新 |
| `news:stream` | `{ news: NewsItem }` | 实时新闻流 |
| `system:status` | `{ status: string }` | 系统状态更新 |

### 5.2 客户端 → 服务端

| 事件名 | 数据格式 | 说明 |
|--------|----------|------|
| `keyword:subscribe` | `{ keywordId: string }` | 订阅关键词告警 |
| `keyword:unsubscribe` | `{ keywordId: string }` | 取消订阅 |

## 6. AI 服务设计（OpenRouter）

### 6.1 接入方式

使用 OpenAI SDK 兼容模式接入 OpenRouter（基于最新文档）：

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5173',
    'X-OpenRouter-Title': 'AI Trend Monitor',
  },
});
```

### 6.2 模型选择

| 用途 | 模型 | 理由 |
|------|------|------|
| 内容真伪识别 | `deepseek/deepseek-chat-v3-0324` | 性价比高、中文能力强 |
| 热点提取 | `deepseek/deepseek-chat-v3-0324` | 同上 |
| 摘要生成 | `deepseek/deepseek-chat-v3-0324` | 同上 |

> 注：模型可通过配置切换，OpenRouter 支持动态切换任意模型

### 6.3 Prompt 设计

#### 内容真伪识别

```
你是一位专业的财经信息验证分析师。请分析以下新闻内容，判断其真实性。

判断标准：
1. 信息来源是否可靠
2. 内容是否存在明显的事实错误
3. 是否有其他来源可以佐证
4. 是否存在夸大或误导性表述

请以 JSON 格式返回：
{
  "isAuthentic": boolean,
  "confidence": number,  // 0-1
  "reason": string,
  "riskLevel": "low" | "medium" | "high"
}

新闻标题：{title}
新闻内容：{content}
来源：{source}
```

#### 热点提取

```
你是一位专业的财经分析师。请从以下新闻列表中提取当前市场热点。

要求：
1. 识别最重要的 3-5 个热点主题
2. 每个热点给出简短摘要
3. 评估热度的 1-100 分
4. 判断情感倾向（利好/利空/中性）

请以 JSON 格式返回：
{
  "trends": [
    {
      "title": string,
      "summary": string,
      "heatScore": number,
      "sentiment": "positive" | "negative" | "neutral",
      "category": string
    }
  ]
}

新闻列表：
{newsList}
```

#### 关键词相关性判断

```
你是一位专业的财经信息匹配分析师。请判断以下新闻是否与监控关键词真正相关。

判断标准：
1. 新闻核心内容是否直接涉及该关键词
2. 是否只是偶然提及（如出现在无关列表中）
3. 对投资者是否有实际参考价值

请以 JSON 格式返回：
{
  "isRelated": boolean,
  "relevanceScore": number,  // 0-1
  "reason": string,
  "investmentImpact": "positive" | "negative" | "neutral" | "none"
}

关键词：{keyword}
新闻标题：{title}
新闻内容：{content}
```

### 6.4 API 参数配置

```typescript
const completion = await openai.chat.completions.create({
  model: 'deepseek/deepseek-chat-v3-0324',
  messages: [...],
  temperature: 0.3,        // 低温度保证分析稳定性
  max_tokens: 1024,
  response_format: { type: 'json_object' },  // 强制 JSON 输出
});
```

## 7. 数据采集设计

### 7.1 采集策略

| 数据源 | 采集频率 | 采集内容 | API/页面 |
|--------|----------|----------|----------|
| 东方财富 | 每 5 分钟 | 7x24 快讯 | `https://np-listapi.eastmoney.com/comm/web/getNewsByColumns` |
| 新浪财经 | 每 5 分钟 | 财经要闻 | `https://feed.mix.sina.com.cn/api/roll/get` |
| 同花顺 | 每 10 分钟 | 热点资讯 | `https://news.10jqka.com.cn/tapp/news/push` |
| 雪球 | 每 10 分钟 | 热门讨论 | `https://xueqiu.com/statuses/hot/listV2.json` |

### 7.2 采集流程

```
node-cron 触发
    ↓
并行请求各数据源
    ↓
cheerio 解析 HTML / JSON 解析
    ↓
去重（URL 去重 + 标题相似度去重）
    ↓
存入 NewsItem 表
    ↓
触发 AI 分析管道
```

### 7.3 去重策略

- **URL 去重**：基于新闻 URL 的 MD5 哈希
- **标题去重**：利用 AI 判断标题相似度 > 80% 视为重复
- **时间窗口**：只采集最近 24 小时内的新闻

## 8. 定时任务设计

```typescript
// 使用 node-cron 调度
import cron from 'node-cron';

// 东方财富快讯 - 每 5 分钟
cron.schedule('*/5 * * * *', () => scrapeEastmoney());

// 新浪财经 - 每 5 分钟
cron.schedule('*/5 * * * *', () => scrapeSina());

// 同花顺 - 每 10 分钟
cron.schedule('*/10 * * * *', () => scrapeTHS());

// 雪球 - 每 10 分钟
cron.schedule('*/10 * * * *', () => scrapeXueqiu());

// 热点发现 - 每 30 分钟
cron.schedule('*/30 * * * *', () => discoverTrends());

// AI 内容验证 - 每 15 分钟
cron.schedule('*/15 * * * *', () => verifyPendingNews());
```

## 9. 前端设计

### 9.1 设计风格：赛博交易终端

| 元素 | 设计 |
|------|------|
| 主背景 | 深灰黑 `#0a0e17` |
| 卡片背景 | 半透明深蓝 `rgba(16, 24, 40, 0.8)` |
| 主强调色 | 霓虹绿 `#00ff88`（利好/正常） |
| 警告色 | 霓虹红 `#ff4757`（利空/暴雷） |
| 中性色 | 琥珀黄 `#ffc107`（中性/待验证） |
| 文字色 | 浅灰白 `#e2e8f0` |
| 次要文字 | 灰色 `#94a3b8` |
| 边框 | 微光边框 `rgba(0, 255, 136, 0.1)` |
| 字体 | JetBrains Mono（数据）+ Inter（正文） |
| 动效 | 数据流滚动、脉冲闪烁、渐入渐出 |

### 9.2 页面结构

```
┌────────────────────────────────────────────────────┐
│  🔴 AI Trend Monitor          [状态灯] [设置齿轮]   │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌─── 关键词监控面板 ──────────────────────────┐   │
│  │ [+ 添加关键词]  [特斯拉] [美伊冲突] [降息]   │   │
│  │                                              │   │
│  │  🔔 特斯拉 - 上海工厂产能提升     2分钟前     │   │
│  │  🔔 美伊冲突 - 制裁新动向         5分钟前     │   │
│  │  ─── 数据流滚动 ───                         │   │
│  └──────────────────────────────────────────────┘   │
│                                                    │
│  ┌─── 热点发现面板 ──────────────────────────┐     │
│  │  🔥 [全部] [地缘] [新能源] [AI] [金融]      │     │
│  │                                              │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │     │
│  │  │ 热点卡片1 │ │ 热点卡片2 │ │ 热点卡片3 │    │     │
│  │  │ 热度: 92  │ │ 热度: 85  │ │ 热度: 78  │    │     │
│  │  │ 📈 利好   │ │ 📉 利空   │ │ ➡️ 中性   │    │     │
│  │  └──────────┘ └──────────┘ └──────────┘    │     │
│  └──────────────────────────────────────────────┘   │
│                                                    │
│  ┌─── 通知中心 ──────────────────────────────┐     │
│  │  🔔 3 条未读  [全部已读]                     │     │
│  │  • 特斯拉相关新闻匹配 - 2分钟前              │     │
│  │  • 美伊冲突升级 - 5分钟前                    │     │
│  └──────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

### 9.3 响应式策略

| 断点 | 布局 |
|------|------|
| ≥ 1024px | 双栏：左侧监控面板 + 右侧热点面板 |
| 768-1023px | 单栏：Tab 切换监控/热点/通知 |
| < 768px | 单栏：底部 Tab 导航 |

## 10. 项目结构

```
Code/
├── docs/
│   ├── requirements.md          # 需求文档
│   └── design.md                # 技术方案
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # 数据库 Schema
│   │   └── dev.db               # SQLite 数据库文件
│   ├── src/
│   │   ├── index.ts             # 入口文件
│   │   ├── config.ts            # 配置管理
│   │   ├── database.ts          # Prisma 客户端
│   │   ├── scheduler.ts         # 定时任务
│   │   ├── routes/
│   │   │   ├── keywords.ts      # 关键词路由
│   │   │   ├── trends.ts        # 热点路由
│   │   │   ├── alerts.ts        # 通知路由
│   │   │   ├── settings.ts      # 设置路由
│   │   │   └── skills.ts        # Agent Skills 路由
│   │   ├── services/
│   │   │   ├── ai.service.ts    # OpenRouter AI 服务
│   │   │   ├── scraper/
│   │   │   │   ├── index.ts     # 采集调度
│   │   │   │   ├── eastmoney.ts # 东方财富
│   │   │   │   ├── sina.ts      # 新浪财经
│   │   │   │   ├── ths.ts       # 同花顺
│   │   │   │   └── xueqiu.ts    # 雪球
│   │   │   ├── monitor.service.ts   # 监控逻辑
│   │   │   ├── trend.service.ts     # 热点发现逻辑
│   │   │   └── alert.service.ts     # 通知逻辑
│   │   └── types/
│   │       └── index.ts         # 类型定义
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── Layout.tsx           # 布局组件
│   │   │   ├── KeywordPanel.tsx     # 关键词监控面板
│   │   │   ├── TrendPanel.tsx       # 热点发现面板
│   │   │   ├── AlertCenter.tsx      # 通知中心
│   │   │   ├── NewsCard.tsx         # 新闻卡片
│   │   │   ├── TrendCard.tsx        # 热点卡片
│   │   │   ├── KeywordTag.tsx       # 关键词标签
│   │   │   └── StatusBar.tsx        # 状态栏
│   │   ├── hooks/
│   │   │   ├── useSocket.ts         # Socket.IO hook
│   │   │   ├── useKeywords.ts       # 关键词 hook
│   │   │   ├── useTrends.ts         # 热点 hook
│   │   │   └── useAlerts.ts         # 通知 hook
│   │   ├── services/
│   │   │   └── api.ts               # API 调用封装
│   │   └── styles/
│   │       └── globals.css          # 全局样式
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── index.html
└── .env.example                     # 环境变量模板
```

## 11. 环境变量

```env
# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# 数据库
DATABASE_URL=file:./dev.db

# 服务端口
PORT=3000

# 前端地址（CORS）
FRONTEND_URL=http://localhost:5173

# AI 模型配置
AI_MODEL=deepseek/deepseek-chat-v3-0324
AI_TEMPERATURE=0.3
AI_MAX_TOKENS=1024

# 采集频率（分钟）
SCRAPE_INTERVAL_FAST=5
SCRAPE_INTERVAL_SLOW=10
TREND_DISCOVERY_INTERVAL=30
```

## 12. 开发步骤

| 步骤 | 内容 | 依赖 |
|------|------|------|
| 1 | 搭建后端骨架（Express + Prisma + Socket.IO） | 无 |
| 2 | 实现数据采集模块（4 个数据源） | 步骤 1 |
| 3 | 接入 OpenRouter AI 服务 | 步骤 1 |
| 4 | 实现关键词监控 + 通知推送 | 步骤 2, 3 |
| 5 | 实现热点发现功能 | 步骤 2, 3 |
| 6 | 开发前端页面 | 步骤 4, 5 |
| 7 | 前后端联调测试 | 步骤 6 |
| 8 | 开发 Agent Skills API | 步骤 7 |
| 9 | 整体测试与验收 | 步骤 8 |

## 13. 关键技术实现要点

### 13.1 Prisma + SQLite 配置（基于最新文档）

Prisma 最新版使用 `prisma.config.ts` 配置连接 URL：

```typescript
// prisma.config.ts
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: "file:./dev.db",
  },
});
```

Schema 中只需声明 provider：

```prisma
datasource db {
  provider = "sqlite"
}
```

### 13.2 Socket.IO 集成（基于 v4 文档）

```typescript
import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("keyword:subscribe", (data) => { /* ... */ });
  socket.on("keyword:unsubscribe", (data) => { /* ... */ });
  socket.on("disconnect", () => { /* ... */ });
});

// 推送告警
io.emit("alert:new", { alert });
```

### 13.3 OpenRouter API 调用（基于最新文档）

使用 OpenAI SDK 兼容模式：

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.FRONTEND_URL,
    'X-OpenRouter-Title': 'AI Trend Monitor',
  },
});

const completion = await openai.chat.completions.create({
  model: process.env.AI_MODEL || 'deepseek/deepseek-chat-v3-0324',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  temperature: 0.3,
  max_tokens: 1024,
  response_format: { type: 'json_object' },
});
```

### 13.4 数据采集反爬策略

- 请求间隔随机化（2-5 秒）
- User-Agent 轮换
- 请求失败自动重试（最多 3 次）
- 使用 axios 的 timeout 防止挂起（10 秒超时）
