import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { ChildRecord } from '../../api/children'
import './index.scss'

const BEHAVIOR_CATEGORIES: Record<string, { label: string; icon: string }> = {
  motor: { label: '运动发展', icon: '🏃' },
  language: { label: '语言发展', icon: '🗣️' },
  social: { label: '社交能力', icon: '👥' },
  cognitive: { label: '认知发展', icon: '🧠' },
  emotional: { label: '情感发展', icon: '❤️' },
}

function formatAge(ageInMonths: number): string {
  const years = Math.floor(ageInMonths / 12)
  const months = ageInMonths % 12
  if (years === 0) return `${months}个月`
  if (months === 0) return `${years}岁`
  return `${years}岁${months}个月`
}

interface RecordCardProps {
  record: ChildRecord
  childId: string
  onFavoriteToggle?: (recordId: string) => void
  showImage?: boolean
}

export default function RecordCard({ record, childId, onFavoriteToggle, showImage = true }: RecordCardProps) {
  const category = BEHAVIOR_CATEGORIES[record.category] || { label: record.category, icon: '📝' }

  // Parse structured analysis
  let structuredAnalysis: Record<string, unknown> | null = null
  let parentingSuggestions: Array<{
    type: string
    content: string
    theoryReference?: string
    deepInsight?: string
  }> = []
  let confidenceLevel = 'medium'

  if (record.analysis) {
    try {
      const parsed = JSON.parse(record.analysis)
      if (parsed.parentingSuggestions) {
        structuredAnalysis = parsed
        confidenceLevel = parsed.confidenceLevel || 'medium'
        parentingSuggestions = parsed.parentingSuggestions || []
      }
    } catch {
      // Legacy plain text format
    }
  }

  const navigateToDetail = () => {
    Taro.setStorageSync('current_record', JSON.stringify(record))
    Taro.navigateTo({ url: `/pages/record-detail/index?id=${record.id}&childId=${childId}` })
  }

  const typeIcons: Record<string, string> = {
    observe: '👁️',
    emotional: '💙',
    guidance: '🌱',
    none: '✅',
  }

  const typeLabels: Record<string, string> = {
    observe: '持续观察',
    emotional: '情绪支持',
    guidance: '适度引导',
    none: '无需建议',
  }

  return (
    <View className='record-card' onClick={navigateToDetail}>
      {/* Image */}
      {showImage && record.imageUrl && (
        <View className='record-image-wrap'>
          <Image src={record.imageUrl} mode='widthFix' className='record-image' />
        </View>
      )}

      <View className='record-body'>
        {/* Header: category + behavior + date */}
        <View className='record-header'>
          <View className='record-header-left'>
            <Text className='record-category-icon'>{category.icon}</Text>
            <View className='record-header-text'>
              <Text className='record-behavior'>{record.behavior}</Text>
              <Text className='record-meta'>
                {new Date(record.date).toLocaleDateString('zh-CN')} · {formatAge(record.ageInMonths)}
              </Text>
            </View>
          </View>
          {onFavoriteToggle && (
            <View
              className='favorite-btn'
              onClick={(e) => {
                e.stopPropagation()
                onFavoriteToggle(record.id)
              }}
            >
              <Text>{record.isFavorite ? '❤️' : '🤍'}</Text>
            </View>
          )}
        </View>

        {/* Milestone */}
        {record.milestones && (
          <View className='milestone-badge'>
            <Text className='milestone-text'>🏆 {record.milestones}</Text>
          </View>
        )}

        {/* Plain text analysis (legacy) */}
        {record.analysis && !structuredAnalysis && (
          <View className='analysis-plain'>
            <Text className='analysis-plain-text'>{record.analysis}</Text>
          </View>
        )}

        {/* Structured analysis preview */}
        {structuredAnalysis && (
          <View className='analysis-structured'>
            {structuredAnalysis.developmentStage && (
              <View className='stage-badge'>
                <Text className='stage-badge-text'>🧒 {structuredAnalysis.developmentStage as string}</Text>
              </View>
            )}

            {/* Show first suggestion as preview */}
            {parentingSuggestions.length > 0 && (
              <View className='suggestion-preview'>
                <Text className='suggestion-icon'>{typeIcons[parentingSuggestions[0].type] || '📌'}</Text>
                <View className='suggestion-content'>
                  <Text className='suggestion-type'>{typeLabels[parentingSuggestions[0].type] || '建议'}</Text>
                  <Text className='suggestion-text' numberOfLines={2}>
                    {parentingSuggestions[0].content}
                  </Text>
                </View>
              </View>
            )}

            {/* Source + confidence badges */}
            <View className='analysis-footer'>
              <View className='badge badge-source'>
                <Text className='badge-text'>
                  {structuredAnalysis.source === 'api' ? '🤖 AI分析' : '📋 本地分析'}
                </Text>
              </View>
              <View className={`badge badge-confidence-${confidenceLevel}`}>
                <Text className='badge-text'>
                  {confidenceLevel === 'high' ? '高置信度' : confidenceLevel === 'medium' ? '中置信度' : '低置信度'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Notes */}
        {record.notes && (
          <View className='record-notes'>
            <Text className='record-notes-text'>备注：{record.notes}</Text>
          </View>
        )}
      </View>
    </View>
  )
}
