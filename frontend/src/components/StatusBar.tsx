import { useState, useEffect, useRef } from 'react'
import type { SystemStatus, Alert } from '../services/api'
import { getAlerts, markAlertRead, markAllAlertsRead } from '../services/api'

interface StatusBarProps {
  connected: boolean
  status: SystemStatus | null
  alerts: Alert[]
  onAlertsUpdate: (alerts: Alert[]) => void
}

/** 通知类型对应的图标、颜色和中文名称 */
const ALERT_STYLE: Record<string, { icon: string; color: string; name: string }> = {
  trend_spike: { icon: '🔥', color: 'text-[var(--accent-red)]', name: '热点飙升' },
  system: { icon: '⚙', color: 'text-[var(--accent-blue)]', name: '系统通知' },
}

/**
 * 顶部状态栏
 * 显示系统运行状态、Socket 连接灯、AI 模型名称、通知中心
 */
export default function StatusBar({ connected, status, alerts, onAlertsUpdate }: StatusBarProps) {
  const [expanded, setExpanded] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  // 状态颜色映射
  const statusColor = connected
    ? 'text-[var(--accent-green)]'
    : 'text-[var(--accent-red)]'

  const statusText = connected ? '已连接' : '已断开'

  // 系统运行状态文字
  const systemLabel = status?.status === 'running'
    ? '运行中'
    : status?.status === 'paused'
      ? '已暂停'
      : status?.status === 'error'
        ? '异常'
        : '等待中'

  const systemColor =
    status?.status === 'running'
      ? 'text-[var(--accent-green)]'
      : status?.status === 'paused'
        ? 'text-[var(--accent-yellow)]'
        : status?.status === 'error'
          ? 'text-[var(--accent-red)]'
          : 'text-[var(--text-secondary)]'

  const unreadCount = alerts.filter((a) => !a.isRead).length

  /** 标记单条已读 */
  const handleMarkRead = async (id: string) => {
    try {
      await markAlertRead(id)
      onAlertsUpdate(
        alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      )
    } catch (err) {
      console.error('标记已读失败:', err)
    }
  }

  /** 全部标记已读 */
  const handleMarkAllRead = async () => {
    try {
      await markAllAlertsRead()
      onAlertsUpdate(alerts.map((a) => ({ ...a, isRead: true })))
    } catch (err) {
      console.error('全部标记已读失败:', err)
    }
  }

  // 点击外部关闭通知中心
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setExpanded(false)
      }
    }

    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [expanded])

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-glow)] glass-effect z-100">
      {/* 左侧：标题 + 系统状态 */}
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold neon-text tracking-wider text-white">
          AI TREND MONITOR
        </h1>
        <span className={`text-xs font-mono-data ${systemColor} px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border-glow)]`}>
          {systemLabel}
        </span>
      </div>

      {/* 右侧：AI 模型 + 连接状态灯 + 通知 */}
      <div className="flex items-center gap-6">
        {/* AI 模型名称 */}
        {status?.config?.aiModel && (
          <span className="text-xs text-[var(--text-secondary)] font-mono-data px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-glow)]">
            {status.config.aiModel}
          </span>
        )}

        {/* 连接状态灯 */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-3 h-3 rounded-full pulse-dot ${statusColor}`}
            style={{ backgroundColor: 'currentColor' }}
          />
          <span className={`text-sm font-mono-data ${statusColor}`}>
            {statusText}
          </span>
        </div>

        {/* 通知中心 */}
        <div className="relative" ref={notificationRef}>
          {/* 展开的通知列表 */}
          {expanded && (
            <div className="absolute right-0 top-full mt-3 w-96 max-h-[400px] rounded-xl card-glow glass-effect overflow-hidden flex flex-col shadow-2xl z-500">
              {/* 标题栏 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-glow)]">
                <span className="text-sm font-bold text-[var(--accent-yellow)] neon-text">
                  通知中心
                </span>
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-green)] transition-colors px-3 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-glow)] hover:border-[var(--accent-green)]"
                >
                  全部已读
                </button>
              </div>

              {/* 通知列表 */}
              <div className="flex-1 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-primary)] flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">暂无通知</p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const style = ALERT_STYLE[alert.type] || ALERT_STYLE.system
                    return (
                      <div
                        key={alert.id}
                        onClick={() => !alert.isRead && handleMarkRead(alert.id)}
                        className={`px-4 py-3 border-b border-[var(--border-glow)] cursor-pointer transition-all duration-300 ${
                          alert.isRead
                            ? 'opacity-50'
                            : 'hover:bg-[var(--accent-blue)]/10'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-base">{style.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${style.color} truncate`}>
                              {style.name}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                              {alert.message}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono-data">
                              {new Date(alert.createdAt).toLocaleString('zh-CN')}
                            </p>
                          </div>
                          {/* 未读指示点 */}
                          {!alert.isRead && (
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--accent-yellow)] shrink-0" />
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* 通知按钮 + 未读徽章 */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="relative w-10 h-10 rounded-full glass-effect border border-[var(--border-glow)] flex items-center justify-center hover:border-[var(--accent-yellow)] transition-all duration-300 card-hover"
          >
            {/* 铃铛图标 */}
            <svg
              className="w-5 h-5 text-[var(--accent-yellow)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {/* 未读数量徽章 */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-[var(--accent-red)] text-white text-xs font-bold font-mono-data flex items-center justify-center px-1 shadow-lg shadow-[var(--accent-red)]/30">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
