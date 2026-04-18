import { useState, useEffect, useCallback } from 'react'
import { getAlerts, markAlertRead, markAllAlertsRead } from '../services/api'
import type { Alert } from '../services/api'

interface AlertCenterProps {
  alerts: Alert[]
  onAlertsUpdate: (alerts: Alert[]) => void
}

/** 通知类型对应的图标、颜色和中文名称 */
const ALERT_STYLE: Record<string, { icon: string; color: string; name: string }> = {
  trend_spike: { icon: '🔥', color: 'text-[var(--accent-red)]', name: '热点飙升' },
  system: { icon: '⚙', color: 'text-[var(--accent-blue)]', name: '系统通知' },
}

/**
 * 通知中心（浮动在右下角）
 * - 未读数量徽章
 * - 通知列表
 * - 全部已读按钮
 * - 点击展开/收起
 */
export default function AlertCenter({ alerts, onAlertsUpdate }: AlertCenterProps) {
  const [expanded, setExpanded] = useState(false)

  // 初始加载通知
  useEffect(() => {
    getAlerts()
      .then((result) => onAlertsUpdate(result.alerts))
      .catch((err) => console.error('加载通知失败:', err))
  }, [onAlertsUpdate])

  const unreadCount = alerts.filter((a) => !a.isRead).length

  /** 标记单条已读 */
  const handleMarkRead = useCallback(
    async (id: string) => {
      try {
        await markAlertRead(id)
        onAlertsUpdate(
          alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a))
        )
      } catch (err) {
        console.error('标记已读失败:', err)
      }
    },
    [alerts, onAlertsUpdate]
  )

  /** 全部标记已读 */
  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllAlertsRead()
      onAlertsUpdate(alerts.map((a) => ({ ...a, isRead: true })))
    } catch (err) {
      console.error('全部标记已读失败:', err)
    }
  }, [alerts, onAlertsUpdate])

  return (
    <div className="fixed top-16 right-4 z-50">
      {/* 展开的通知列表 */}
      {expanded && (
        <div className="mb-2 w-80 max-h-96 rounded-lg card-glow bg-[var(--bg-card)] overflow-hidden flex flex-col shadow-2xl">
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-glow)]">
            <span className="text-xs font-bold text-[var(--accent-yellow)]">
              通知中心
            </span>
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent-green)] transition-colors"
            >
              全部已读
            </button>
          </div>

          {/* 通知列表 */}
          <div className="flex-1 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] text-center py-6">
                暂无通知
              </p>
            ) : (
              alerts.map((alert) => {
                const style = ALERT_STYLE[alert.type] || ALERT_STYLE.system
                return (
                  <div
                    key={alert.id}
                    onClick={() => !alert.isRead && handleMarkRead(alert.id)}
                    className={`px-4 py-2.5 border-b border-[var(--border-glow)] cursor-pointer transition-colors ${
                      alert.isRead
                        ? 'opacity-50'
                        : 'hover:bg-[var(--accent-green)]/5'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-sm">{style.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${style.color} truncate`}>
                          {style.name}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                          {alert.message}
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-mono-data">
                          {new Date(alert.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      {/* 未读指示点 */}
                      {!alert.isRead && (
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent-yellow)] shrink-0" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* 浮动按钮 + 未读徽章 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="relative w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border-glow)] flex items-center justify-center hover:border-[var(--accent-yellow)] transition-colors shadow-lg"
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
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[var(--accent-red)] text-white text-[10px] font-bold font-mono-data flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}
