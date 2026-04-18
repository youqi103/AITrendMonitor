# 🎯 AI Trend Monitor

![Status](https://img.shields.io/badge/status-production-blue?style=flat-square)
![Node](https://img.shields.io/badge/node-%3E=18-green?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-orange?style=flat-square)

**股市热点监控与发现工具** — 专为炒股短线玩家设计，实时监控财经热点，第一时间推送通知。

***

## ✨ 功能特性

| 功能                      | 说明                                  |
| ----------------------- | ----------------------------------- |
| 🔍 **关键词监控**            | 添加关注关键词（如"特斯拉"、"降息"），AI 自动判断内容相关性   |
| 📊 **热点发现**             | 自动采集多源财经资讯，AI 提取市场热点并排序             |
| 🛡️ **AI 内容验证**         | 识别虚假/假冒内容，过滤噪音                      |
| 📡 **实时推送**             | Socket.IO 双向实时通讯 + 浏览器 Notification |
| 🤖 **Agent Skills API** | 标准化 REST 接口，供其他 AI Agent 调用         |
| 📧 **邮件通知**             | 配置邮箱后，匹配成功第一时间发送邮件                  |

***

## 🛠️ 技术栈

<div align="center">

|      后端     |     前端     |       AI 服务      |    定时任务   |       数据采集      |
| :---------: | :--------: | :--------------: | :-------: | :-------------: |
|  Express 5  |  React 19  |  OpenRouter API  | node-cron | axios + cheerio |
|   Prisma 7  |   Vite 8   | deepseek-chat-v3 |     —     |        —        |
|    SQLite   | Tailwind 4 |         —        |     —     |        —        |
| Socket.IO 4 |      —     |         —        |     —     |        —        |

</div>

***

## 🚀 快速开始

### 1️⃣ 安装依赖

```bash
# 根目录安装
npm install

# 后端依赖
cd backend && npm install

# 前端依赖
cd frontend && npm install
```

### 2️⃣ 环境配置

在 `backend/` 目录创建 `.env` 文件：

```bash
# OpenRouter AI（必须）
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# 数据库（可选，默认使用 SQLite）
DATABASE_URL=file:./dev.db

# 服务端口（可选，默认 3000）
PORT=3000
FRONTEND_URL=http://localhost:5173

# AI 模型配置（可选）
AI_MODEL=deepseek/deepseek-chat-v3-0324
AI_TEMPERATURE=0.3

# 采集频率（分钟，可选）
SCRAPE_INTERVAL_FAST=5
SCRAPE_INTERVAL_SLOW=10
TREND_DISCOVERY_INTERVAL=30
```

### 3️⃣ 初始化数据库

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 4️⃣ 启动服务

```bash
# 终端 1 - 后端 (端口 3000)
cd backend && npm run dev

# 终端 2 - 前端 (端口 5173)
cd frontend && npm run dev
```

> 🎉 访问 **<http://localhost:5173>** 即可使用

***

## 📰 数据源

|   数据源   |   采集频率  | 说明      |
| :-----: | :-----: | :------ |
| 🏦 东方财富 |  每 5 分钟 | A 股资讯最全 |
| 📺 新浪财经 |  每 5 分钟 | 覆盖面广    |
|  📈 同花顺 | 每 10 分钟 | 短线数据丰富  |
|  ❄️ 雪球  | 每 10 分钟 | 社区讨论多   |
| 💡 36Kr | 每 10 分钟 | 科技创业资讯  |
| 📝 界面新闻 | 每 10 分钟 | 原创新闻资讯  |

***

## 🔌 API 接口

### 关键词监控

|    方法    | 路径                       | 说明      |
| :------: | :----------------------- | :------ |
|   `GET`  | `/api/monitor-terms`     | 获取监控词列表 |
|  `POST`  | `/api/monitor-terms`     | 添加监控词   |
|   `PUT`  | `/api/monitor-terms/:id` | 更新监控词   |
| `DELETE` | `/api/monitor-terms/:id` | 删除监控词   |

### 热点发现

|   方法  | 路径                | 说明     |
| :---: | :---------------- | :----- |
| `GET` | `/api/trends`     | 获取热点列表 |
| `GET` | `/api/trends/:id` | 获取热点详情 |

### 通知中心

|   方法  | 路径                     | 说明     |
| :---: | :--------------------- | :----- |
| `GET` | `/api/alerts`          | 获取通知列表 |
| `PUT` | `/api/alerts/:id/read` | 标记已读   |
| `PUT` | `/api/alerts/read-all` | 全部标记已读 |

### 系统状态

|   方法  | 路径                     | 说明      |
| :---: | :--------------------- | :------ |
| `GET` | `/api/status`          | 系统运行状态  |
| `GET` | `/api/dashboard/stats` | 仪表盘统计数据 |

### Agent Skills

|    方法    | 路径                                | 说明      |
| :------: | :-------------------------------- | :------ |
|  `POST`  | `/api/skills/monitor-keyword`     | 添加关键词监控 |
| `DELETE` | `/api/skills/monitor-keyword/:id` | 移除关键词监控 |
|  `POST`  | `/api/skills/discover-trends`     | 触发热点发现  |
|   `GET`  | `/api/skills/alerts`              | 获取告警列表  |

***

## 📡 Socket.IO 事件

### 服务端 → 客户端

| 事件              | 数据格式                  | 说明       |
| :-------------- | :-------------------- | :------- |
| `alert:new`     | `{ alert: Alert }`    | 📢 新告警通知 |
| `trend:update`  | `{ trends: Trend[] }` | 📊 热点更新  |
| `news:stream`   | `{ news: NewsItem }`  | 📰 实时新闻流 |
| `system:status` | `{ status: string }`  | 🔔 系统状态  |

### 客户端 → 服务端

| 事件                    | 数据格式                    | 说明       |
| :-------------------- | :---------------------- | :------- |
| `keyword:subscribe`   | `{ keywordId: string }` | 🔗 订阅关键词 |
| `keyword:unsubscribe` | `{ keywordId: string }` | 🔗 取消订阅  |

***

## 📂 项目结构

```
Code/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma           # 数据库 Schema
│   ├── src/
│   │   ├── index.ts                # 🚀 入口文件
│   │   ├── config.ts               # ⚙️ 配置管理
│   │   ├── database.ts            # 💾 Prisma 客户端
│   │   ├── scheduler.ts            # ⏰ 定时任务
│   │   ├── routes/                 # 🛤️ API 路由
│   │   │   ├── monitor-terms.ts   # 关键词路由
│   │   │   ├── trends.ts          # 热点路由
│   │   │   ├── alerts.ts          # 通知路由
│   │   │   ├── settings.ts        # 设置路由
│   │   │   ├── skills.ts          # Agent Skills 路由
│   │   │   ├── search.ts          # 搜索路由
│   │   │   └── notification.ts    # 通知路由
│   │   ├── services/               # ⚡ 业务逻辑
│   │   │   ├── ai.service.ts       # 🤖 OpenRouter AI 服务
│   │   │   ├── monitor.service.ts # 🔍 监控服务
│   │   │   ├── trend.service.ts   # 📊 热点服务
│   │   │   ├── email.service.ts    # 📧 邮件服务
│   │   │   └── scraper/            # 🌐 数据采集
│   │   │       └── index.ts
│   │   └── types/
│   │       └── index.ts            # 📝 类型定义
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # 📱 应用入口
│   │   ├── components/             # 🧩 UI 组件
│   │   │   ├── Dashboard.tsx      # 📊 仪表盘
│   │   │   ├── MonitorPanel.tsx   # 🔍 监控面板
│   │   │   ├── TrendPanel.tsx     # 📈 热点面板
│   │   │   ├── SearchPanel.tsx     # 🔎 搜索面板
│   │   │   ├── AlertCenter.tsx     # 🔔 通知中心
│   │   │   ├── StatusBar.tsx       # 📶 状态栏
│   │   │   ├── TrendCard.tsx       # 📊 热点卡片
│   │   │   └── NewsCard.tsx       # 📰 新闻卡片
│   │   ├── hooks/
│   │   │   └── useSocket.ts       # 📡 Socket.IO Hook
│   │   └── services/
│   │       └── api.ts              # 🌐 API 调用封装
│   └── package.json
│
├── docs/
│   ├── requirements.md             # 📋 需求文档
│   └── design.md                   # 📐 技术方案
│
└── package.json                    # 👤 根目录配置
```

***

## 🎨 设计风格

采用 **赛博交易终端** 风格 — 深色底 + 霓虹绿/红涨跌色 + 数据流滚动效果。

|     用途    |     颜色    | 说明  |
| :-------: | :-------: | :-- |
|  🟢 利好/正常 | `#00ff88` | 霓虹绿 |
|  🔴 利空/暴雷 | `#ff4757` | 霓虹红 |
| 🟡 中性/待验证 | `#ffc107` | 琥珀黄 |

|  元素  |            色值            |
| :--: | :----------------------: |
|  主背景 |         `#0a0e17`        |
| 卡片背景 |  `rgba(16, 24, 40, 0.8)` |
|  边框  | `rgba(0, 255, 136, 0.1)` |

***

