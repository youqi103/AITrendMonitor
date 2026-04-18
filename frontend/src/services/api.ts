/* ========== 类型定义 ========== */

/** 监控词 */
export interface MonitorTerm {
  id: string;
  word: string;
  scope: string | null;
  status: "active" | "paused";
  createdAt: string;
  updatedAt: string;
  _count?: { alerts: number };
}

/** 新闻条目 */
export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: string;
  crawledAt: string;
  aiSummary: string | null;
  isVerified: boolean;
  sentiment: string | null;
}

/** 热点趋势 */
export interface Trend {
  id: string;
  title: string;
  summary: string;
  category: string | null;
  heatScore: number;
  newsId: string | null;
  createdAt: string;
  news?: NewsItem | null;
}

/** 通知/告警 */
export interface Alert {
  id: string;
  monitorTermId: string;
  newsId: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  monitorTerm?: MonitorTerm;
  news?: NewsItem;
}

/** 系统状态 */
export interface SystemStatus {
  status: string;
  uptime: number;
  timestamp: string;
  config: {
    aiModel: string;
    scrapeIntervalFast: number;
    scrapeIntervalSlow: number;
    trendDiscoveryInterval: number;
  };
}

/** 搜索结果 */
export interface SearchResult {
  news: NewsItem;
  relevance?: {
    isRelated: boolean;
    relevanceScore: number;
    investmentImpact: string;
  };
  isAuthentic?: boolean;
}

export interface SearchResponse {
  query: string;
  expandedQueries: string[];
  total: number;
  results: SearchResult[];
}

/** 搜索历史 */
export interface SearchHistoryItem {
  id: string;
  query: string;
  source: string;
  results: number;
  createdAt: string;
}

/* ========== API 封装 ========== */

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API 请求失败: ${res.status} ${res.statusText}`);
  }
  // 处理 204 No Content 响应
  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

/* --- 监控词 API --- */

export function getMonitorTerms() {
  return request<MonitorTerm[]>("/monitor-terms");
}

export function addMonitorTerm(data: { word: string; scope?: string }) {
  return request<MonitorTerm>("/monitor-terms", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMonitorTerm(
  id: string,
  data: Partial<Pick<MonitorTerm, "word" | "scope" | "status">>,
) {
  return request<MonitorTerm>(`/monitor-terms/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function setMonitorTermStatus(id: string, status: "active" | "paused") {
  return request<MonitorTerm>(`/monitor-terms/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteMonitorTerm(id: string) {
  return request<void>(`/monitor-terms/${id}`, { method: "DELETE" });
}

/* --- 热点趋势 API --- */

export async function getTrends(params?: {
  category?: string;
  limit?: number;
}) {
  const queryParts: string[] = [];
  if (params?.category)
    queryParts.push(`category=${encodeURIComponent(params.category)}`);
  if (params?.limit) queryParts.push(`limit=${params.limit}`);
  const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const result = await request<{ trends: Trend[]; total: number }>(
    `/trends${query}`,
  );
  return result.trends;
}

/* --- 通知 API --- */

export async function getAlerts(params?: { unreadOnly?: boolean }) {
  const query = params?.unreadOnly ? "?unreadOnly=true" : "";
  const result = await request<{ alerts: Alert[]; unreadCount: number }>(
    `/alerts${query}`,
  );
  return { alerts: result.alerts, unreadCount: result.unreadCount };
}

export function markAlertRead(id: string) {
  return request<Alert>(`/alerts/${id}/read`, { method: "PUT" });
}

export function markAllAlertsRead() {
  return request<{ success: boolean }>("/alerts/read-all", { method: "PUT" });
}

/* --- 全网搜索 API --- */

export async function search(query: string, sources?: string[]) {
  return request<SearchResponse>("/search", {
    method: "POST",
    body: JSON.stringify({ query, sources }),
  });
}

export function getSearchHistory() {
  return request<SearchHistoryItem[]>("/search/history");
}

/* --- 系统状态 API --- */

export function getSystemStatus() {
  return request<SystemStatus>("/status");
}

export interface DashboardStats {
  totalTrends: number;
  todayTrends: number;
  urgentAlerts: number;
  monitorTerms: number;
  latestTrends: Trend[];
}

export function getDashboardStats() {
  return request<DashboardStats>("/dashboard/stats");
}

/* --- 通知设置 API --- */

export interface NotificationSetting {
  id: string;
  email: string | null;
  emailEnabled: boolean;
  websocketEnabled: boolean;
}

export function getNotificationSetting() {
  return request<NotificationSetting>("/notification");
}

export function updateNotificationSetting(
  data: Partial<
    Pick<NotificationSetting, "email" | "emailEnabled" | "websocketEnabled">
  >,
) {
  return request<NotificationSetting>("/notification", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
