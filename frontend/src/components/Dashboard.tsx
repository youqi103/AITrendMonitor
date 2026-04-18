import { useState, useEffect } from 'react'
import { getDashboardStats, DashboardStats } from '../services/api'
import TrendCard from './TrendCard'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => console.error('获取仪表盘数据失败:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col h-full rounded-lg card-glow bg-[var(--bg-card)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-glow)]">
          <h2 className="text-sm font-bold tracking-wide text-[var(--accent-blue)]">
            仪表盘
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-[var(--text-secondary)]">加载中...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex flex-col h-full rounded-lg card-glow bg-[var(--bg-card)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-glow)]">
          <h2 className="text-sm font-bold tracking-wide text-[var(--accent-blue)]">
            仪表盘
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-[var(--accent-red)]">数据加载失败</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full rounded-xl card-glow bg-[var(--bg-card)] overflow-hidden card-hover">
      <div className="px-4 py-4 border-b border-[var(--border-glow)]">
        <h2 className="text-base font-bold tracking-wide text-white neon-text">
          仪表盘
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">实时监控市场热点</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        <div className="glass-effect rounded-xl p-4 border border-[var(--border-glow)] card-hover">
          <p className="text-xs text-[var(--text-secondary)] mb-2">总热点</p>
          <p className="text-2xl font-bold font-mono-data text-[var(--accent-green)]">
            {stats.totalTrends}
          </p>
          <div className="mt-2 h-1 w-12 bg-[var(--accent-green)] rounded-full opacity-70"></div>
        </div>
        <div className="glass-effect rounded-xl p-4 border border-[var(--border-glow)] card-hover">
          <p className="text-xs text-[var(--text-secondary)] mb-2">今日新增</p>
          <p className="text-2xl font-bold font-mono-data text-[var(--accent-blue)]">
            {stats.todayTrends}
          </p>
          <div className="mt-2 h-1 w-12 bg-[var(--accent-blue)] rounded-full opacity-70"></div>
        </div>
        <div className="glass-effect rounded-xl p-4 border border-[var(--border-glow)] card-hover">
          <p className="text-xs text-[var(--text-secondary)] mb-2">紧急热点</p>
          <p className="text-2xl font-bold font-mono-data text-[var(--accent-red)]">
            {stats.urgentAlerts}
          </p>
          <div className="mt-2 h-1 w-12 bg-[var(--accent-red)] rounded-full opacity-70"></div>
        </div>
        <div className="glass-effect rounded-xl p-4 border border-[var(--border-glow)] card-hover">
          <p className="text-xs text-[var(--text-secondary)] mb-2">监控关键词</p>
          <p className="text-2xl font-bold font-mono-data text-[var(--accent-yellow)]">
            {stats.monitorTerms}
          </p>
          <div className="mt-2 h-1 w-12 bg-[var(--accent-yellow)] rounded-full opacity-70"></div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-t border-b border-[var(--border-glow)]">
          <h3 className="text-sm font-bold text-white">最新热点</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {stats.latestTrends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-primary)] flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">暂无热点数据</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.latestTrends.map((trend) => (
                <TrendCard key={trend.id} trend={trend} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
