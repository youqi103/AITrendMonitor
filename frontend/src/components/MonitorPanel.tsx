import { useState, useEffect, useCallback } from 'react'
import {
  getMonitorTerms,
  addMonitorTerm,
  setMonitorTermStatus,
  deleteMonitorTerm,
  getAlerts,
} from '../services/api'
import type { MonitorTerm, NewsItem, Alert } from '../services/api'
import NewsCard from './NewsCard'

interface MonitorPanelProps {
  newsItems: NewsItem[]
}

/**
 * 监控词管理面板
 * - 添加监控词（监控词 + 范围）
 * - 监控词标签列表（可删除、可激活/暂停）
 * - 匹配到的新闻列表（从告警中获取）
 */
export default function MonitorPanel({ newsItems }: MonitorPanelProps) {
  const [terms, setTerms] = useState<MonitorTerm[]>([])
  const [newWord, setNewWord] = useState('')
  const [newScope, setNewScope] = useState('全部')
  const [loading, setLoading] = useState(false)
  const [matchedAlerts, setMatchedAlerts] = useState<Alert[]>([])

  useEffect(() => {
    getMonitorTerms()
      .then(setTerms)
      .catch((err) => console.error('加载监控词失败:', err))
  }, [])

  useEffect(() => {
    getAlerts()
      .then((result) => setMatchedAlerts(result.alerts))
      .catch((err) => console.error('加载告警失败:', err))
  }, [])

  const handleAdd = useCallback(async () => {
    const word = newWord.trim()
    if (!word) return
    setLoading(true)
    try {
      const created = await addMonitorTerm({ word, scope: newScope })
      setTerms((prev) => [...prev, created])
      setNewWord('')
    } catch (err) {
      console.error('添加监控词失败:', err)
    } finally {
      setLoading(false)
    }
  }, [newWord, newScope])

  const handleToggleStatus = useCallback(async (term: MonitorTerm) => {
    const newStatus = term.status === 'active' ? 'paused' : 'active'
    try {
      const updated = await setMonitorTermStatus(term.id, newStatus)
      setTerms((prev) =>
        prev.map((t) => (t.id === term.id ? updated : t))
      )
    } catch (err) {
      console.error('更新监控词状态失败:', err)
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteMonitorTerm(id)
      setTerms((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      console.error('删除监控词失败:', err)
    }
  }, [])

  const allMatchedNews: NewsItem[] = [
    ...matchedAlerts
      .filter((a) => a.news)
      .map((a) => a.news as NewsItem),
    ...newsItems,
  ]
  const uniqueNews = Array.from(
    new Map(allMatchedNews.map((n) => [n.id, n])).values()
  )

  return (
    <div className="flex flex-col h-full rounded-xl card-glow bg-[var(--bg-card)] overflow-hidden card-hover">
      <div className="px-4 py-4 border-b border-[var(--border-glow)]">
        <h2 className="text-base font-bold tracking-wide text-white neon-text">
          监控词管理
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">实时监控关键词</p>
      </div>

      <div className="px-4 py-4 border-b border-[var(--border-glow)] flex gap-3">
        <input
          type="text"
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="输入监控词..."
          className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-glow)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-blue)] transition-all duration-300"
        />
        <select
          value={newScope}
          onChange={(e) => setNewScope(e.target.value)}
          className="bg-[var(--bg-primary)] border border-[var(--border-glow)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition-all duration-300"
        >
          <option value="全部">全部</option>
          <option value="科技">科技</option>
          <option value="金融">金融</option>
          <option value="医疗">医疗</option>
          <option value="能源">能源</option>
          <option value="教育">教育</option>
        </select>
        <button
          onClick={handleAdd}
          disabled={loading || !newWord.trim()}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
            loading || !newWord.trim()
              ? 'bg-[var(--bg-primary)] text-[var(--text-secondary)] cursor-not-allowed border border-[var(--border-glow)]'
              : 'btn-primary'
          }`}
        >
          添加
        </button>
      </div>

      <div className="px-4 py-4 border-b border-[var(--border-glow)]">
        {terms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-primary)] flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">暂无监控词，请添加</p>
          </div>
        ) : (
          <div className="space-y-3">
            {terms.map((term) => (
              <div
                key={term.id}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-300 card-hover ${
                  term.status === 'active'
                    ? 'border-[var(--accent-green)]/50 bg-[var(--accent-green)]/5'
                    : 'border-[var(--border-glow)] bg-[var(--bg-primary)]/30 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${
                    term.status === 'active'
                      ? 'text-[var(--accent-green)]'
                      : 'text-[var(--text-secondary)]'
                  }`}>
                    {term.word}
                  </span>
                  {term.scope && (
                    <span className="text-xs px-2 py-1 rounded-lg bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-glow)]">
                      {term.scope}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="toggle-container">
                    <input
                      type="checkbox"
                      id={`toggle-${term.id}`}
                      checked={term.status === 'active'}
                      onChange={() => handleToggleStatus(term)}
                      className="toggle-input"
                    />
                    <label htmlFor={`toggle-${term.id}`} className="toggle-slider"></label>
                  </div>
                  <button
                    onClick={() => handleDelete(term.id)}
                    className="px-3 py-1.5 rounded-lg text-xs text-[var(--accent-red)] border border-[var(--accent-red)]/30 hover:bg-[var(--accent-red)]/10 transition-all duration-300"
                    title="删除"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <p className="text-sm text-[var(--text-secondary)] mb-2">
          匹配新闻 ({uniqueNews.length})
        </p>
        {uniqueNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-primary)] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">等待匹配新闻...</p>
          </div>
        ) : (
          uniqueNews.map((news) => (
            <NewsCard key={news.id} news={news} />
          ))
        )}
      </div>
    </div>
  )
}
