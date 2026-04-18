import type { NewsItem } from '../services/api'

interface NewsCardProps {
  news: NewsItem
}

/** 情感标签样式映射 */
const SENTIMENT_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  positive: { label: '利好', color: 'text-[var(--accent-green)]', bg: 'bg-[var(--accent-green)]/10' },
  negative: { label: '利空', color: 'text-[var(--accent-red)]', bg: 'bg-[var(--accent-red)]/10' },
  neutral:  { label: '中性', color: 'text-[var(--accent-yellow)]', bg: 'bg-[var(--accent-yellow)]/10' },
}

/**
 * 新闻卡片组件
 * 显示：标题、来源、时间、AI 摘要、情感标签
 */
export default function NewsCard({ news }: NewsCardProps) {
  const sentiment = SENTIMENT_STYLE[news.sentiment ?? 'neutral'] || SENTIMENT_STYLE.neutral

  return (
    <div className="rounded-xl border border-[var(--border-glow)] glass-effect p-4 card-hover transition-all duration-300">
      {/* 标题行 */}
      <div className="flex items-start justify-between gap-3">
        <a
          href={news.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-white hover:text-[var(--accent-blue)] transition-colors duration-300 line-clamp-2"
        >
          {news.title}
        </a>
        {/* 情感标签 */}
        <span className={`shrink-0 px-2 py-1 rounded-lg text-xs font-bold ${sentiment.color} ${sentiment.bg} border border-current/30`}>
          {sentiment.label}
        </span>
      </div>

      {/* 来源 + 时间 */}
      <div className="flex items-center gap-3 mt-2">
        <span className="text-xs text-[var(--text-secondary)] font-medium">{news.source}</span>
        <span className="text-xs text-[var(--text-secondary)]">·</span>
        <span className="text-xs text-[var(--text-secondary)] font-mono-data">
          {new Date(news.publishedAt).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* AI 摘要 */}
      {news.aiSummary && (
        <p className="text-xs text-[var(--text-secondary)] mt-3 line-clamp-2">
          {news.aiSummary}
        </p>
      )}

    </div>
  )
}
