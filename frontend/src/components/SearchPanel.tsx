import { useState, useCallback } from 'react'
import { search, getSearchHistory, SearchResponse, SearchHistoryItem, NewsItem } from '../services/api'
import NewsCard from './NewsCard'

const SOURCE_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'eastmoney', label: '东方财富' },
  { value: 'sina', label: '新浪财经' },
  { value: 'ths', label: '同花顺' },
  { value: 'xueqiu', label: '雪球' },
  { value: '36kr', label: '36Kr' },
  { value: 'jiemian', label: '界面新闻' },
  { value: 'ce', label: '财新' },
]

export default function SearchPanel() {
  const [query, setQuery] = useState('')
  const [selectedSources, setSelectedSources] = useState<string[]>(['all'])
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = useCallback(() => {
    getSearchHistory()
      .then(setHistory)
      .catch((err) => console.error('加载搜索历史失败:', err))
  }, [])

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    try {
      const sources = selectedSources.includes('all') ? undefined : selectedSources
      const response = await search(q, sources)
      setResults(response)
      loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败')
    } finally {
      setLoading(false)
    }
  }, [query, selectedSources, loadHistory])

  const handleSourceToggle = useCallback((source: string) => {
    setSelectedSources((prev) => {
      if (source === 'all') return ['all']
      const filtered = prev.filter((s) => s !== 'all')
      if (filtered.includes(source)) {
        const newSources = filtered.filter((s) => s !== source)
        return newSources.length === 0 ? ['all'] : newSources
      }
      return [...filtered, source]
    })
  }, [])

  const handleHistoryClick = useCallback((item: SearchHistoryItem) => {
    setQuery(item.query)
    setLoading(true)
    setError(null)
    const sources = item.source.includes(',') ? undefined : [item.source]
    search(item.query, sources)
      .then(setResults)
      .catch((err) => setError(err instanceof Error ? err.message : '搜索失败'))
      .finally(() => setLoading(false))
  }, [])

  const handleExpandedQueryClick = useCallback((eq: string) => {
    setQuery(eq)
    setLoading(true)
    setError(null)
    search(eq, selectedSources.includes('all') ? undefined : selectedSources)
      .then(setResults)
      .catch((err) => setError(err instanceof Error ? err.message : '搜索失败'))
      .finally(() => setLoading(false))
  }, [selectedSources])

  return (
    <div className="flex flex-col h-full rounded-xl card-glow bg-[var(--bg-card)] overflow-hidden card-hover">
      <div className="px-4 py-4 border-b border-[var(--border-glow)]">
        <h2 className="text-base font-bold tracking-wide text-white neon-text">
          全网搜索
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">快速搜索全网热点</p>
      </div>

      <div className="px-4 py-4 border-b border-[var(--border-glow)] space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="输入关键词搜索全网..."
            className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-glow)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-blue)] transition-all duration-300"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              loading || !query.trim()
                ? 'bg-[var(--bg-primary)] text-[var(--text-secondary)] cursor-not-allowed border border-[var(--border-glow)]'
                : 'btn-primary'
            }`}
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {SOURCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSourceToggle(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-300 ${
                selectedSources.includes(opt.value)
                  ? 'gradient-bg text-white font-medium shadow-lg shadow-[var(--accent-blue)]/20'
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-glow)] hover:border-[var(--accent-blue)] hover:text-[var(--text-primary)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {results && results.expandedQueries.length > 1 && (
        <div className="px-4 py-3 border-b border-[var(--border-glow)] glass-effect">
          <p className="text-xs text-[var(--text-secondary)] mb-2">AI 扩展搜索词：</p>
          <div className="flex flex-wrap gap-2">
            {results.expandedQueries.map((eq, i) => (
              <button
                key={i}
                onClick={() => handleExpandedQueryClick(eq)}
                title="点击搜索此词"
                className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-300 hover:scale-105 card-hover ${
                  i === 0
                    ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30'
                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-glow)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]'
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 text-sm text-[var(--accent-red)] bg-[var(--accent-red)]/5 border-b border-[var(--accent-red)]/30">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {results ? (
          <>
            <p className="text-sm text-[var(--text-secondary)]">
              找到 {results.total} 条相关结果
            </p>
            {results.results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-full bg-[var(--bg-primary)] flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">未找到相关结果，请尝试其他关键词</p>
              </div>
            ) : (
              results.results.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <NewsCard news={item.news} />
                  {item.relevance && (
                    <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg glass-effect">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        item.relevance.relevanceScore >= 0.7
                          ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/30'
                          : item.relevance.relevanceScore >= 0.5
                            ? 'bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)] border border-[var(--accent-yellow)]/30'
                            : 'bg-[var(--text-secondary)]/10 text-[var(--text-secondary)] border border-[var(--text-secondary)]/30'
                      }`}>
                        相关度: {(item.relevance.relevanceScore * 100).toFixed(0)}%
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        item.relevance.investmentImpact === 'positive'
                          ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/30'
                          : item.relevance.investmentImpact === 'negative'
                            ? 'bg-[var(--accent-red)]/10 text-[var(--accent-red)] border border-[var(--accent-red)]/30'
                            : 'bg-[var(--text-secondary)]/10 text-[var(--text-secondary)] border border-[var(--text-secondary)]/30'
                      }`}>
                        {item.relevance.investmentImpact === 'positive' ? '利好' :
                         item.relevance.investmentImpact === 'negative' ? '利空' : '中性'}
                      </span>
                      {item.isAuthentic !== undefined && (
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          item.isAuthentic
                            ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30'
                            : 'bg-[var(--accent-red)]/10 text-[var(--accent-red)] border border-[var(--accent-red)]/30'
                        }`}>
                          {item.isAuthentic ? '已验证' : '待验证'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">搜索历史</p>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-full bg-[var(--bg-primary)] flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">暂无搜索历史</p>
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg glass-effect border border-[var(--border-glow)] transition-all duration-300 card-hover"
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-sm font-medium text-white">{item.query}</span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {item.source.split(',').map(s => SOURCE_OPTIONS.find(o => o.value === s)?.label || s).join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-glow)]">{item.results} 条结果</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
