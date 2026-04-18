import { useState, useCallback, useEffect } from 'react'
import StatusBar from './components/StatusBar'
import MonitorPanel from './components/MonitorPanel'
import TrendPanel from './components/TrendPanel'
import SearchPanel from './components/SearchPanel'
import Dashboard from './components/Dashboard'
import { useSocket } from './hooks/useSocket'
import { getSystemStatus } from './services/api'
import type { Alert, Trend, NewsItem, SystemStatus } from './services/api'

export default function App() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [trends, setTrends] = useState<Trend[]>([])
  const [activeTab, setActiveTab] = useState<'monitor' | 'search' | 'dashboard'>('dashboard')

  useEffect(() => {
    getSystemStatus()
      .then(setSystemStatus)
      .catch((err) => console.error('获取系统状态失败:', err))
  }, [])

  const { connected } = useSocket({
    onAlert: useCallback((alert: Alert) => {
      setAlerts((prev) => [alert, ...prev])
    }, []),
    onTrendUpdate: useCallback((newTrends: Trend[]) => {
      setTrends(newTrends)
    }, []),
    onNewsStream: useCallback((news: NewsItem) => {
      setNewsItems((prev) => [news, ...prev.slice(0, 49)])
    }, []),
    onSystemStatus: useCallback((status: SystemStatus) => {
      setSystemStatus(status)
    }, []),
  })

  const handleAlertsUpdate = useCallback((updated: Alert[]) => {
    setAlerts(updated)
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <StatusBar connected={connected} status={systemStatus} alerts={alerts} onAlertsUpdate={handleAlertsUpdate} />
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        <div className="lg:w-1/2 flex flex-col min-h-0">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'dashboard'
                  ? 'gradient-bg text-white shadow-lg shadow-[var(--accent-blue)]/20'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-glow)] hover:border-[var(--accent-blue)] hover:text-[var(--text-primary)]'
              }`}
            >
              仪表盘
            </button>
            <button
              onClick={() => setActiveTab('monitor')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'monitor'
                  ? 'gradient-bg text-white shadow-lg shadow-[var(--accent-blue)]/20'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-glow)] hover:border-[var(--accent-blue)] hover:text-[var(--text-primary)]'
              }`}
            >
              监控词
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'search'
                  ? 'gradient-bg text-white shadow-lg shadow-[var(--accent-blue)]/20'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-glow)] hover:border-[var(--accent-blue)] hover:text-[var(--text-primary)]'
              }`}
            >
              全网搜索
            </button>
          </div>
          {activeTab === 'dashboard' ? (
            <Dashboard />
          ) : activeTab === 'monitor' ? (
            <MonitorPanel newsItems={newsItems} />
          ) : (
            <SearchPanel />
          )}
        </div>
        <div className="lg:w-1/2 flex flex-col min-h-0">
          <TrendPanel trends={trends} />
        </div>
      </div>
    </div>
  )
}
