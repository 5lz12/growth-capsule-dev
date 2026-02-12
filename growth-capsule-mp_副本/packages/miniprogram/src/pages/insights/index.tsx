import { useState, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { childrenApi, Child, ChildRecord } from '../../api/children'
import './index.scss'

const CATEGORIES = [
  { value: 'motor', label: '运动发展', icon: '🏃' },
  { value: 'language', label: '语言发展', icon: '🗣️' },
  { value: 'social', label: '社交能力', icon: '👥' },
  { value: 'cognitive', label: '认知发展', icon: '🧠' },
  { value: 'emotional', label: '情感发展', icon: '❤️' },
]

type TimeRange = '1m' | '3m' | '6m' | 'all'

function formatAge(ageInMonths: number): string {
  const years = Math.floor(ageInMonths / 12)
  const months = ageInMonths % 12
  if (years === 0) return `${months}个月`
  if (months === 0) return `${years}岁`
  return `${years}岁${months}个月`
}

function filterRecordsByRange(records: ChildRecord[], range: TimeRange): ChildRecord[] {
  if (range === 'all') return records
  const now = Date.now()
  const ranges = { '1m': 30, '3m': 90, '6m': 180 }
  const cutoff = now - ranges[range] * 24 * 60 * 60 * 1000
  return records.filter(r => new Date(r.date).getTime() >= cutoff)
}

function generateSummary(
  childName: string,
  records: ChildRecord[],
  range: TimeRange
) {
  const rangeText = { '1m': '近1个月', '3m': '近3个月', '6m': '近6个月', all: '全部' }[range]

  const categoryCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: records.filter(r => r.category === cat.value).length,
  }))

  const maxCategory = categoryCounts.reduce((a, b) => (a.count > b.count ? a : b))

  const overview = `在${rangeText}内，${childName}共有 ${records.length} 条成长记录。` +
    (maxCategory.count > 0
      ? `记录主要集中在${maxCategory.label}，其中${maxCategory.label}领域的记录最多（${maxCategory.count}条），这表明该领域是当前发展的重点。`
      : '目前还在积累记录中。')

  const dimensions = categoryCounts
    .filter(cat => cat.count > 0)
    .map(cat => {
      const analysisMap: Record<string, string> = {
        motor: `运动能力的发展是儿童早期成长的重要指标。${cat.count}条记录显示了该领域的发展轨迹。`,
        language: `语言发展是认知和社会性发展的基础。${cat.count}条记录反映了语言能力的进步。`,
        social: `社交能力的发展体现了儿童从自我中心向社会化的转变。${cat.count}条记录展示了与他人互动的过程。`,
        cognitive: `认知发展体现了儿童对世界的理解和思考能力。${cat.count}条记录反映了好奇心和思维的发展。`,
        emotional: `情感能力的发展是心理健康的基础。${cat.count}条记录记录了情绪识别和调节能力的成长。`,
      }
      const theoryMap: Record<string, string> = {
        motor: '基于格塞尔发展量表和动作发展理论',
        language: '参考维果茨基语言发展理论和皮亚杰认知发展理论',
        social: '基于埃里克森心理社会发展理论和鲍尔比依恋理论',
        cognitive: '基于皮亚杰认知发展理论',
        emotional: '基于情绪智力理论和发展心理学情感发展研究',
      }
      return {
        icon: cat.icon,
        category: cat.label,
        analysis: analysisMap[cat.value] || `该维度有${cat.count}条记录。`,
        theory: theoryMap[cat.value] || '',
      }
    })

  const advice = `基于${records.length}条记录的分析，${childName}在多个领域都表现出积极的发展态势。建议在保持当前优势领域的同时，适当关注相对薄弱的领域。每个孩子的发展节奏不同，最重要的是提供安全、支持性的环境。`

  return { overview, dimensions, advice }
}

export default function InsightsPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [range, setRange] = useState<TimeRange>('all')
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const res = await childrenApi.list()
      if (res.success && res.data.length > 0) {
        setChildren(res.data)
        if (!selectedChildId) {
          setSelectedChildId(res.data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load insights:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedChildId])

  useDidShow(() => {
    loadData()
  })

  if (loading) {
    return (
      <View className='insights-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (children.length === 0) {
    return (
      <View className='insights-page'>
        <View className='empty-state'>
          <Text className='empty-icon'>📊</Text>
          <Text className='empty-title'>还没有数据</Text>
          <Text className='empty-desc'>添加孩子并记录成长瞬间后，这里会显示成长洞察</Text>
          <View className='empty-btn' onClick={() => Taro.navigateTo({ url: '/pages/add-child/index' })}>
            <Text className='empty-btn-text'>添加孩子</Text>
          </View>
        </View>
      </View>
    )
  }

  const selectedChild = children.find(c => c.id === selectedChildId) || children[0]
  const records = selectedChild.records || []
  const filteredRecords = filterRecordsByRange(records, range)

  const ageInMonths = Math.floor(
    (Date.now() - new Date(selectedChild.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  )

  // Category distribution
  const categoryData = CATEGORIES.map(cat => ({
    ...cat,
    count: filteredRecords.filter(r => r.category === cat.value).length,
  }))
  const maxCount = Math.max(...categoryData.map(c => c.count), 1)

  // Summary
  const summary = generateSummary(selectedChild.name, filteredRecords, range)

  // Recent analyses
  const recentAnalyses = filteredRecords
    .filter(r => r.analysis)
    .slice(0, 5)
    .map(r => {
      let parsed: Record<string, unknown> = {}
      try {
        parsed = JSON.parse(r.analysis!)
      } catch {
        // ignore
      }
      return { record: r, analysis: parsed }
    })

  const rangeOptions = [
    { value: '1m' as TimeRange, label: '近1个月' },
    { value: '3m' as TimeRange, label: '近3个月' },
    { value: '6m' as TimeRange, label: '近6个月' },
    { value: 'all' as TimeRange, label: '全部' },
  ]

  return (
    <View className='insights-page'>
      {/* Child selector */}
      {children.length > 1 && (
        <ScrollView scrollX className='child-selector'>
          <View className='child-chips'>
            {children.map(child => (
              <View
                key={child.id}
                className={`child-chip ${selectedChildId === child.id ? 'active' : ''}`}
                onClick={() => setSelectedChildId(child.id)}
              >
                <Text className='child-chip-icon'>
                  {child.gender === 'male' ? '👦' : '👧'}
                </Text>
                <Text className='child-chip-name'>{child.name}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Child info card */}
      <View className='info-card'>
        <Text className='info-title'>{selectedChild.name}的内心世界成长地图</Text>
        <Text className='info-subtitle'>
          {formatAge(ageInMonths)} · {records.length} 条记录
        </Text>
      </View>

      {/* Time range selector */}
      <View className='range-selector'>
        {rangeOptions.map(opt => (
          <View
            key={opt.value}
            className={`range-chip ${range === opt.value ? 'active' : ''}`}
            onClick={() => setRange(opt.value)}
          >
            <Text className='range-text'>{opt.label}</Text>
          </View>
        ))}
      </View>

      {/* Category distribution */}
      {filteredRecords.length > 0 ? (
        <View className='section'>
          <Text className='section-title'>成长维度分布</Text>

          {/* Bar chart placeholder */}
          <View className='bar-chart'>
            {categoryData.map(cat => (
              <View key={cat.value} className='bar-item'>
                <View className='bar-label-row'>
                  <Text className='bar-icon'>{cat.icon}</Text>
                  <Text className='bar-label'>{cat.label}</Text>
                  <Text className='bar-count'>{cat.count}</Text>
                </View>
                <View className='bar-track'>
                  <View
                    className='bar-fill'
                    style={{ width: `${Math.max((cat.count / maxCount) * 100, 2)}%` }}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Category grid */}
          <View className='category-grid'>
            {categoryData.map(cat => (
              <View key={cat.value} className='category-stat'>
                <Text className='stat-icon'>{cat.icon}</Text>
                <Text className='stat-label'>{cat.label}</Text>
                <Text className='stat-count'>{cat.count}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View className='section empty-section'>
          <Text className='empty-section-text'>该时间段内没有记录</Text>
        </View>
      )}

      {/* Summary */}
      {filteredRecords.length > 0 && (
        <View className='section'>
          <Text className='section-title'>阶段性成长总结</Text>

          <View className='disclaimer'>
            <Text className='disclaimer-text'>
              温馨提示：以下总结基于发展心理学理论提供参考，不替代专业心理评估或医疗建议。
            </Text>
          </View>

          <View className='summary-card overview'>
            <Text className='summary-label'>📊 发展概述</Text>
            <Text className='summary-text'>{summary.overview}</Text>
          </View>

          {summary.dimensions.map((dim, idx) => (
            <View key={idx} className='summary-card dimension'>
              <Text className='summary-label'>{dim.icon} {dim.category}</Text>
              <Text className='summary-text'>{dim.analysis}</Text>
              {dim.theory && (
                <Text className='summary-theory'>📚 {dim.theory}</Text>
              )}
            </View>
          ))}

          <View className='summary-card advice'>
            <Text className='summary-label'>💗 养育建议</Text>
            <Text className='summary-text'>{summary.advice}</Text>
          </View>
        </View>
      )}

      {/* Recent analyses */}
      {recentAnalyses.length > 0 && (
        <View className='section'>
          <Text className='section-title'>最近的AI解读</Text>
          {recentAnalyses.map(({ record, analysis }) => (
            <View
              key={record.id}
              className='analysis-card'
              onClick={() => Taro.navigateTo({ url: `/pages/record-detail/index?id=${record.id}` })}
            >
              <View className='analysis-header'>
                <Text className='analysis-behavior'>{record.behavior}</Text>
                <Text className='analysis-date'>
                  {new Date(record.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                </Text>
              </View>
              {analysis.developmentStage && (
                <Text className='analysis-stage'>
                  发展阶段：{analysis.developmentStage as string}
                </Text>
              )}
              <Text className='analysis-link'>查看详情 →</Text>
            </View>
          ))}
        </View>
      )}

      {/* Theory basis */}
      <View className='theory-card'>
        <Text className='theory-title'>📚 理论基础</Text>
        <Text className='theory-text'>
          本洞察分析基于经典发展心理学理论，包括：皮亚杰认知发展理论、埃里克森心理社会发展理论、维果茨基社会文化理论、鲍尔比依恋理论、格塞尔发展量表。
        </Text>
      </View>

      {/* Footer quote */}
      <View className='footer-quote'>
        <Text className='quote-text'>"每一份微小的变化，都是成长的勋章。"</Text>
      </View>
    </View>
  )
}
