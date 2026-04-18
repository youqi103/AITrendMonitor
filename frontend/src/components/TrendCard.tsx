import type { Trend } from '../services/api'

interface TrendCardProps {
  trend: Trend
}

/**
 * 热点卡片组件
 * 显示：标题、摘要、热度条、分类标签
 */
export default function TrendCard({ trend }: TrendCardProps) {

  // 热度分数 0-100
  const heat = Math.min(100, Math.max(0, trend.heatScore ?? 0))

  return (
    <div className="rounded-xl border border-[var(--border-glow)] glass-effect p-4 card-hover transition-all duration-300">
      {/* 标题 */}
      <h3 className="text-sm font-bold line-clamp-2">
        <a 
          href={trend.news?.url || `https://www.baidu.com/s?wd=${encodeURIComponent(trend.title)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white hover:text-[var(--accent-blue)] transition-colors duration-300"
        >
          {trend.title}
        </a>
      </h3>

      {/* 摘要 */}
      {trend.summary && (
        <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-2">
          {trend.summary}
        </p>
      )}

      {/* 热度条 */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--text-secondary)]">热度</span>
          <span className="text-xs font-mono-data text-[var(--text-primary)]">
            {heat}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--bg-primary)] overflow-hidden">
          <div
            className="h-full rounded-full heat-bar transition-all duration-800 ease-out"
            style={{ width: `${heat}%` }}
          />
        </div>
      </div>

      {/* 底部：分类标签 + 更新时间 */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          {/* 分类标签 */}
          {trend.category && (
            <span className="px-2 py-0.5 rounded-lg text-xs bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-medium">
              {trend.category}
            </span>
          )}
        </div>
        <span className="text-xs text-[var(--text-secondary)] font-mono-data">
          {new Date(trend.createdAt).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
}
