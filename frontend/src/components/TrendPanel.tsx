import { useState, useEffect } from 'react'
import { getTrends } from '../services/api'
import type { Trend } from '../services/api'
import TrendCard from './TrendCard'

interface TrendPanelProps {
  trends: Trend[]
}

/** 分类列表 */
const CATEGORIES = ['全部', '科技', '金融', '医疗', '能源', '教育', '政策', '其他']

/**
 * 标准化分类值，确保与分类列表匹配
 * @param category 原始分类值
 * @returns 标准化后的分类值
 */
const normalizeCategory = (category: string | null | undefined): string => {
  if (!category) return '其他'
  
  // 标准化映射表，处理可能的变体
  const categoryMap: Record<string, string> = {
    '科技': '科技',
    '技术': '科技',
    'tech': '科技',
    '金融': '金融',
    '财经': '金融',
    'finance': '金融',
    '医疗': '医疗',
    '健康': '医疗',
    'health': '医疗',
    '能源': '能源',
    '电力': '能源',
    'energy': '能源',
    '教育': '教育',
    '学习': '教育',
    'education': '教育',
    '政策': '政策',
    '法规': '政策',
    '政治': '政策',
    'politics': '政策',
    'policy': '政策'
  }
  
  return categoryMap[category] || '其他'
}

/**
 * 热点发现面板
 * - 分类筛选标签
 * - 开始扫描按钮
 * - 热点卡片网格（标题、摘要、热度分数、情感倾向）
 */
export default function TrendPanel({ trends }: TrendPanelProps) {
  const [activeCategory, setActiveCategory] = useState('全部')
  const [localTrends, setLocalTrends] = useState<Trend[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [hasScanned, setHasScanned] = useState(false)

  // 页面加载时自动获取热点数据
  useEffect(() => {
    scanTrends()
  }, [])

  // 扫描热点数据
  const scanTrends = () => {
    setIsScanning(true)
    getTrends()
      .then((data) => {
        // 标准化分类值
        const normalizedData = data.map(trend => ({
          ...trend,
          category: normalizeCategory(trend.category)
        }))
        setLocalTrends(normalizedData)
        setHasScanned(true)
      })
      .catch((err) => console.error('加载热点失败:', err))
      .finally(() => setIsScanning(false))
  }

  // 合并 props 中的实时更新数据
  useEffect(() => {
    if (trends.length > 0) {
      setLocalTrends((prev) => {
        const map = new Map(prev.map((t) => [t.id, t]))
        for (const t of trends) {
          // 标准化分类值
          const normalizedTrend = {
            ...t,
            category: normalizeCategory(t.category)
          }
          map.set(t.id, normalizedTrend)
        }
        return Array.from(map.values())
      })
    }
  }, [trends])

  // 按分类筛选（category 可能为 null）
  const filtered = 
    activeCategory === '全部'
      ? localTrends
      : localTrends.filter((t) => t.category === activeCategory)

  return (
    <div className="flex flex-col h-full rounded-xl card-glow bg-[var(--bg-card)] overflow-hidden card-hover">
      {/* 面板标题和扫描按钮 */}
      <div className="px-4 py-4 border-b border-[var(--border-glow)] flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold tracking-wide text-white neon-text">
            热点发现
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">快速扫描市场热点</p>
        </div>
        <button
          onClick={scanTrends}
          disabled={isScanning}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
            isScanning
              ? 'bg-[var(--bg-primary)] text-[var(--text-secondary)] cursor-not-allowed border border-[var(--border-glow)]'
              : 'btn-primary'
          }`}
        >
          {isScanning ? '扫描中...' : '立即扫描'}
        </button>
      </div>

      {/* 分类筛选标签 */}
      <div className="px-4 py-3 border-b border-[var(--border-glow)] flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300 ${
              activeCategory === cat
                ? 'gradient-bg text-white font-bold shadow-lg shadow-[var(--accent-blue)]/20'
                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-glow)] hover:border-[var(--accent-blue)] hover:text-[var(--text-primary)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 热点卡片网格 */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasScanned || isScanning ? (
          <div className="flex flex-col items-center justify-center h-full">
            {isScanning ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin mb-4"></div>
                <p className="text-sm text-[var(--accent-blue)]">正在扫描热点数据...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[var(--bg-primary)] flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">点击立即扫描按钮获取热点数据</p>
              </div>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-primary)] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">暂无热点数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filtered.map((trend) => (
              <TrendCard key={trend.id} trend={trend} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
