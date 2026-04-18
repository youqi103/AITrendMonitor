export interface KeywordCreateInput {
  word: string;
  scope?: string;
}

export interface KeywordUpdateInput {
  word?: string;
  scope?: string;
  isActive?: boolean;
}

export interface NewsItemRaw {
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: Date;
}

export interface AIAuthenticityResult {
  isAuthentic: boolean;
  confidence: number;
  reason: string;
  riskLevel: "low" | "medium" | "high";
}

export interface AIRelevanceResult {
  isRelated: boolean;
  relevanceScore: number;
  reason: string;
  investmentImpact: "positive" | "negative" | "neutral" | "none";
}

export interface AITrendResult {
  trends: {
    title: string;
    summary: string;
    heatScore: number;
    sentiment: "positive" | "negative" | "neutral";
    category: string;
  }[];
}

export interface SocketEvents {
  "alert:new": (data: { alert: any }) => void;
  "trend:update": (data: { trends: any[] }) => void;
  "news:stream": (data: { news: any }) => void;
  "system:status": (data: { status: string }) => void;
  "keyword:subscribe": (data: { keywordId: string }) => void;
  "keyword:unsubscribe": (data: { keywordId: string }) => void;
}
