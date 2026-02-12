import { useState, useCallback } from 'react'
import { View, Text, Input, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { childrenApi, Child, ChildRecord } from '../../api/children'
import './index.scss'

const CATEGORIES = [
  { value: 'motor', label: '运动发展', icon: '🏃' },
  { value: 'language', label: '语言发展', icon: '🗣️' },
  { value: 'social', label: '社交能力', icon: '👥' },
  { value: 'cognitive', label: '认知发展', icon: '🧠' },
  { value: 'emotional', label: '情感发展', icon: '❤️' },
]

interface RecordWithChild extends ChildRecord {
  childName: string
}

function formatDateGroup(dateKey: string): string {
  const date = new Date(dateKey + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const isThisYear = year === now.getFullYear()
  const dateStr = isThisYear ? `${month}月${day}日` : `${year}年${month}月${day}日`

  if (diffDays === 0) return `${dateStr} · 今天`
  if (diffDays === 1) return `${dateStr} · 昨天`
  if (diffDays < 7) return `${dateStr} · ${diffDays}天前`
  return dateStr
}

function groupByDate(records: RecordWithChild[]): Record<string, RecordWithChild[]> {
  const groups: Record<string, RecordWithChild[]> = {}
  for (const record of records) {
    const dateKey = new Date(record.date).toISOString().split('T')[0]
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(record)
  }
  return groups
}

export default function TimelinePage() {
  const [children, setChildren] = useState<Child[]>([])
  const [allRecords, setAllRecords] = useState<RecordWithChild[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const res = await childrenApi.list()
      if (res.success) {
        setChildren(res.data)
        const records: RecordWithChild[] = []
        for (const child of res.data) {
          if (child.records) {
            for (const r of child.records) {
              records.push({ ...r, childName: child.name })
            }
          }
        }
        records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setAllRecords(records)
      }
    } catch (error) {
      console.error('Failed to load timeline:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    loadData()
  })

  usePullDownRefresh(async () => {
    await loadData()
    Taro.stopPullDownRefresh()
  })

  // Filter records
  let filteredRecords = allRecords
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    filteredRecords = filteredRecords.filter(
      r =>
        r.behavior.toLowerCase().includes(q) ||
        (r.notes && r.notes.toLowerCase().includes(q)) ||
        r.childName.toLowerCase().includes(q) ||
        CATEGORIES.find(c => c.value === r.category)?.label.includes(q)
    )
  }
  if (activeCategory) {
    filteredRecords = filteredRecords.filter(r => r.category === activeCategory)
  }

  const grouped = groupByDate(filteredRecords)

  const navigateToDetail = (recordId: string) => {
    Taro.navigateTo({ url: `/pages/record-detail/index?id=${recordId}` })
  }

  if (loading) {
    return (
      <View className='timeline-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='timeline-page'>
      {/* Search bar */}
      <View className='search-bar'>
        <Text className='search-icon'>🔍</Text>
        <Input
          className='search-input'
          placeholder='搜索行为记录...'
          value={searchQuery}
          onInput={e => setSearchQuery(e.detail.value)}
        />
        {searchQuery && (
          <Text className='search-clear' onClick={() => setSearchQuery('')}>
            清除
          </Text>
        )}
      </View>

      {/* Category filter chips */}
      <ScrollView scrollX className='category-filters'>
        <View className='filter-chips'>
          <View
            className={`filter-chip ${!activeCategory ? 'active' : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            <Text className='chip-text'>全部</Text>
          </View>
          {CATEGORIES.map(cat => (
            <View
              key={cat.value}
              className={`filter-chip ${activeCategory === cat.value ? 'active' : ''}`}
              onClick={() => setActiveCategory(activeCategory === cat.value ? null : cat.value)}
            >
              <Text className='chip-icon'>{cat.icon}</Text>
              <Text className='chip-text'>{cat.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Search result hint */}
      {searchQuery.trim() && (
        <View className='search-hint'>
          <Text className='search-hint-text'>
            找到 {filteredRecords.length} 条包含 "{searchQuery}" 的记录
          </Text>
        </View>
      )}

      {/* Timeline content */}
      {filteredRecords.length === 0 ? (
        <View className='empty-state'>
          <Text className='empty-icon'>📭</Text>
          <Text className='empty-text'>
            {allRecords.length === 0 ? '还没有成长记录' : '没有匹配的记录'}
          </Text>
        </View>
      ) : (
        <View className='timeline-content'>
          <View className='timeline-line' />
          {Object.entries(grouped).map(([dateKey, dateRecords]) => (
            <View key={dateKey} className='date-group'>
              {/* Date header */}
              <View className='date-header'>
                <View className='date-dot' />
                <Text className='date-text'>{formatDateGroup(dateKey)}</Text>
              </View>

              {/* Record cards */}
              <View className='date-records'>
                {dateRecords.map(record => {
                  const categoryInfo = CATEGORIES.find(c => c.value === record.category)
                  let hasAnalysis = false
                  if (record.analysis) {
                    try {
                      const parsed = JSON.parse(record.analysis)
                      hasAnalysis = !!parsed.parentingSuggestions
                    } catch {
                      hasAnalysis = !!record.analysis
                    }
                  }

                  return (
                    <View
                      key={record.id}
                      className='record-card'
                      onClick={() => navigateToDetail(record.id)}
                    >
                      {/* Category badge */}
                      {categoryInfo && (
                        <View className='category-badge'>
                          <Text className='badge-icon'>{categoryInfo.icon}</Text>
                          <Text className='badge-text'>{categoryInfo.label}</Text>
                        </View>
                      )}

                      {/* Behavior */}
                      <Text className='record-behavior'>{record.behavior}</Text>

                      {/* Notes */}
                      {record.notes && (
                        <Text className='record-notes'>{record.notes}</Text>
                      )}

                      {/* Image */}
                      {record.imageUrl && (
                        <View className='record-image-wrap'>
                          <Image src={record.imageUrl} mode='aspectFill' className='record-image' />
                        </View>
                      )}

                      {/* Footer */}
                      <View className='record-footer'>
                        <Text className='record-child-name'>{record.childName}</Text>
                        {hasAnalysis && (
                          <View className='analysis-badge'>
                            <Text className='analysis-badge-text'>AI解读</Text>
                          </View>
                        )}
                      </View>

                      {/* Milestones */}
                      {record.milestones && (
                        <View className='milestone-badge'>
                          <Text className='milestone-text'>🏆 {record.milestones}</Text>
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
