import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { recordsApi, Record } from '../../api/records'
import { FavoriteButton } from '../../components/FavoriteButton'
import { FeedbackButtons } from '../../components/FeedbackButtons'
import './index.scss'

const POLL_INTERVAL = 2000
const POLL_MAX_ATTEMPTS = 30 // 60 seconds max

// 行为类别常量
const BEHAVIOR_CATEGORIES = [
  { value: 'motor', label: '运动发展', icon: '🏃' },
  { value: 'language', label: '语言发展', icon: '🗣️' },
  { value: 'social', label: '社交能力', icon: '👥' },
  { value: 'cognitive', label: '认知发展', icon: '🧠' },
  { value: 'emotional', label: '情感发展', icon: '❤️' },
] as const

export default function RecordDetailPage() {
  const router = useRouter()
  const recordId = router.params.id as string

  const [record, setRecord] = useState<Record | null>(null)
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollCount = useRef(0)

  const parseAnalysis = useCallback((data: Record) => {
    if (data.analysis) {
      try {
        const parsed = JSON.parse(data.analysis)
        if (parsed.parentingSuggestions) {
          setAnalysis(parsed)
        }
      } catch {
        // Legacy text format
      }
    }
  }, [])

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current)
      pollTimer.current = null
    }
    pollCount.current = 0
  }, [])

  const pollForAnalysis = useCallback(async () => {
    if (pollCount.current >= POLL_MAX_ATTEMPTS) {
      stopPolling()
      setAnalyzing(false)
      return
    }

    pollCount.current++
    try {
      const res = await recordsApi.getById(recordId)
      if (res.success && res.data) {
        setRecord(res.data)
        const status = res.data.analysisStatus

        if (status === 'done') {
          parseAnalysis(res.data)
          stopPolling()
          setAnalyzing(false)
          return
        }

        if (status === 'failed') {
          stopPolling()
          setAnalyzing(false)
          return
        }
      }
    } catch {
      // Continue polling on transient errors
    }

    pollTimer.current = setTimeout(pollForAnalysis, POLL_INTERVAL)
  }, [recordId, parseAnalysis, stopPolling])

  const loadRecord = async () => {
    try {
      const res = await recordsApi.getById(recordId)
      if (res.success && res.data) {
        setRecord(res.data)
        parseAnalysis(res.data)

        // Start polling if analysis is not ready
        const status = res.data.analysisStatus
        if (status === 'pending' || status === 'analyzing') {
          setAnalyzing(true)
          pollTimer.current = setTimeout(pollForAnalysis, POLL_INTERVAL)
        }
      }
    } catch (error) {
      console.error('Failed to load record:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecord()
    return () => stopPolling()
  }, [recordId])

  const handleBack = () => {
    if (record?.childId) {
      Taro.navigateBack()
    }
  }

  const handleEdit = () => {
    Taro.navigateTo({ url: `/pages/record-edit/index?id=${recordId}` })
  }

  useShareAppMessage(() => {
    if (!record) return {}
    const title = `${record.childName || '孩子'}的成长解读`
    const content = `${record.behavior}\n\n${analysis?.psychologicalInterpretation || record.analysis || ''}`
    return { title, path: `/pages/record-detail/index?id=${recordId}` }
  })

  useShareTimeline(() => {
    if (!record) return {}
    const title = `${record.childName || '孩子'}的成长解读`
    return { title, path: `/pages/record-detail/index?id=${recordId}` }
  })

  const formatAge = (ageInMonths: number): string => {
    const years = Math.floor(ageInMonths / 12)
    const months = ageInMonths % 12
    if (years === 0) return `${months}个月`
    if (months === 0) return `${years}岁`
    return `${years}岁${months}个月`
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const categoryInfo = BEHAVIOR_CATEGORIES.find(c => c.value === record?.category)

  if (loading) {
    return (
      <View className='record-detail-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!record) {
    return (
      <View className='record-detail-page'>
        <View className='empty-state'>
          <Text>记录不存在</Text>
        </View>
      </View>
    )
  }

  const stageLabel = generateStageLabel(record.ageInMonths, categoryInfo?.label)

  return (
    <View className='record-detail-page'>
      <ScrollView scrollY className='detail-scroll'>
        {/* Header */}
        <View className='detail-header'>
          <View className='header-left'>
            <View className='back-btn' onClick={handleBack}>
              <Text className='back-icon'>←</Text>
            </View>
          </View>
          <View className='header-center'>
            <Text className='header-title'>成长深度解读</Text>
            <Text className='header-subtitle'>Growth Insight</Text>
          </View>
          <View className='header-right'>
            <View className='icon-btn' onClick={handleEdit}>
              <Text className='icon-text'>✏️</Text>
            </View>
          </View>
        </View>

        {/* Stage badge */}
        <View className='stage-badge'>
          <Text className='stage-text'>{stageLabel}</Text>
        </View>

        {/* Record card */}
        <View className='record-card'>
          {record.imageUrl && (
            <View className='record-image'>
              <Image
                src={record.imageUrl}
                mode='aspectFill'
                className='image-img'
              />
            </View>
          )}

          <View className='record-content'>
            <View className='record-meta'>
              {categoryInfo && (
                <View className='category-tag'>
                  <Text className='category-icon'>{categoryInfo.icon}</Text>
                  <Text className='category-label'>{categoryInfo.label}</Text>
                </View>
              )}
              <Text className='record-date'>{formatDate(record.date)}</Text>
            </View>

            <Text className='record-behavior'>{record.behavior}</Text>

            {record.notes && (
              <Text className='record-notes'>{record.notes}</Text>
            )}

            <View className='record-footer'>
              <Text className='record-footer-text'>📍 {record.childName}，{formatAge(record.ageInMonths)}</Text>
            </View>
          </View>
        </View>

        {/* Analysis sections */}
        {analysis ? (
          <View className='analysis-sections'>
            {/* Development stage */}
            <View className='analysis-card stage-card'>
              <Text className='card-title'>🌱 当前发展阶段</Text>
              <Text className='card-text'>{analysis.developmentStage}</Text>
            </View>

            {/* Psychology interpretation */}
            <View className='analysis-card psych-card'>
              <Text className='card-title'>🧠 心理学视角</Text>
              <Text className='card-text'>{analysis.psychologicalInterpretation}</Text>
            </View>

            {/* Emotional interpretation */}
            {analysis.emotionalInterpretation && (
              <View className='analysis-card emotion-card'>
                <Text className='card-title'>❤️ 暖心解读</Text>
                <View className='emotion-quote'>
                  <Text className='quote-text'>"{analysis.emotionalInterpretation}"</Text>
                </View>
                <Text className='emotion-footer'>
                  作为父母，看到孩子的这一刻，您一定也感受到了成长的喜悦。
                </Text>
              </View>
            )}

            {/* Parenting suggestions */}
            <View className='analysis-card suggestions-card'>
              <Text className='card-title'>💡 陪伴建议</Text>

              {analysis.parentingSuggestions.map((suggestion: any, idx: number) => {
                const typeConfig: Record<string, any> = {
                  observe: { icon: '👁️', label: '持续观察', theme: 'gray' },
                  emotional: { icon: '💙', label: '情绪支持', theme: 'blue' },
                  guidance: { icon: '🌱', label: '适度引导', theme: 'amber' },
                  none: { icon: '✅', label: '无需建议', theme: 'green' },
                }
                const config = typeConfig[suggestion.type] || typeConfig.observe

                return (
                  <View key={idx} className={`suggestion-item suggestion-${config.theme}`}>
                    <View className='suggestion-header'>
                      <Text className='suggestion-icon'>{config.icon}</Text>
                      <Text className='suggestion-label'>{config.label}</Text>
                    </View>
                    <Text className='suggestion-content'>{suggestion.content}</Text>

                    {suggestion.deepInsight && (
                      <View className='suggestion-insight'>
                        <Text className='insight-label'>💬 你可以这样对孩子说：</Text>
                        <Text className='insight-text'>"{suggestion.deepInsight}"</Text>
                      </View>
                    )}

                    {suggestion.theoryReference && (
                      <Text className='suggestion-theory'>📚 {suggestion.theoryReference}</Text>
                    )}
                  </View>
                )
              })}
            </View>

            {/* Confidence */}
            <View className='confidence-card'>
              <Text className='confidence-label'>ℹ️ 分析置信度：</Text>
              <Text className='confidence-value'>
                {analysis.confidenceLevel === 'high' && '高 - 明确的发展里程碑'}
                {analysis.confidenceLevel === 'medium' && '中 - 可能的阶段性表现'}
                {analysis.confidenceLevel === 'low' && '低 - 建议持续观察'}
              </Text>
              <Text className='confidence-source'>
                来源：{analysis.source === 'api' ? '外部AI分析' : '本地心理学规则引擎'}
              </Text>
            </View>

            {/* Feedback */}
            <View className='feedback-section'>
              <FeedbackButtons recordId={record.id} />
            </View>

            {/* Disclaimer */}
            <View className='disclaimer-card'>
              <Text className='disclaimer-text'>
                ⚠️ 温馨提示：本解读基于发展心理学理论提供参考，不替代专业心理评估或医疗建议。每个孩子的发展节奏不同，请结合实际情况理解。
              </Text>
            </View>
          </View>
        ) : analyzing ? (
          <View className='analyzing-state'>
            <Text className='analyzing-icon'>🔍</Text>
            <Text className='analyzing-title'>正在分析中...</Text>
            <Text className='analyzing-desc'>心理学引擎正在解读这条成长记录</Text>
          </View>
        ) : record.analysisStatus === 'failed' ? (
          <View className='no-analysis'>
            <Text>分析失败，请稍后重试</Text>
          </View>
        ) : (
          <View className='no-analysis'>
            <Text>暂无分析数据</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating favorite button */}
      {record && (
        <View className='favorite-float'>
          <FavoriteButton recordId={record.id} initialIsFavorite={record.isFavorite} />
        </View>
      )}
    </View>
  )
}

function generateStageLabel(ageInMonths: number, category?: string): string {
  const years = Math.floor(ageInMonths / 12)
  const months = ageInMonths % 12

  let ageStr = ''
  if (years > 0) {
    ageStr = `${years}岁`
    if (months > 0) {
      ageStr += `${months}个月`
    }
  } else {
    ageStr = `${months}个月`
  }

  const labels: Record<string, string[]> = {
    motor: ['小小探险家', '活力宝贝', '运动健将', '灵活小猴'],
    language: ['语言小天才', '表达小能手', '故事大王', '话语精灵'],
    social: ['社交小达人', '友谊使者', '合作小伙伴', '贴心宝贝'],
    cognitive: ['小小思考家', '好奇宝宝', '智慧之星', '问题探究者'],
    emotional: ['情感小管家', '温暖天使', '情绪小主人', '贴心小棉袄'],
  }

  const categoryLabels = category ? labels[category] || labels.cognitive : labels.cognitive
  const randomLabel = categoryLabels[Math.floor(Math.random() * categoryLabels.length)]

  return `${ageStr}：${randomLabel}`
}
