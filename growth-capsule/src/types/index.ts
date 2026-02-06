import { SuggestionType, ConfidenceLevel, ParentingSuggestion } from '@/lib/analyzers/base'

export interface Child {
  id: string
  name: string
  birthDate: Date
  gender: string
  createdAt: Date
  updatedAt: Date
}

export interface Record {
  id: string
  childId: string
  category: string
  behavior: string
  date: Date
  ageInMonths: number
  notes?: string | null
  analysis?: string | null
  milestones?: string | null
  createdAt: Date
  updatedAt: Date

  // 新增字段：结构化分析数据（JSON 存储在 analysis 字段中）
  structuredAnalysis?: {
    developmentStage: string
    psychologicalInterpretation: string
    parentingSuggestions: ParentingSuggestion[]
    milestone?: string
    confidenceLevel: ConfidenceLevel
    source: 'local' | 'api'
  }
}

export interface AnalysisRule {
  id: string
  ageRange: string
  category: string
  behaviorKey: string
  analysis: string
  milestone: string
  importance: string
  createdAt: Date
}

export const BEHAVIOR_CATEGORIES = [
  { value: 'motor', label: '运动发展', icon: '🏃' },
  { value: 'language', label: '语言发展', icon: '🗣️' },
  { value: 'social', label: '社交能力', icon: '👥' },
  { value: 'cognitive', label: '认知发展', icon: '🧠' },
  { value: 'emotional', label: '情感发展', icon: '❤️' },
] as const

export const GENDER_OPTIONS = [
  { value: 'male', label: '男孩' },
  { value: 'female', label: '女孩' },
] as const

/**
 * 建议类型配置
 */
export const SUGGESTION_TYPE_CONFIG = {
  observe: {
    label: '持续观察',
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    description: '行为正常，无需特殊干预，保持观察即可',
  },
  emotional: {
    label: '情绪支持',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    description: '提供接纳和共情，让孩子感受到情感支持',
  },
  guidance: {
    label: '适度引导',
    color: 'amber',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    description: '可以尝试适当引导，但不强迫',
  },
  none: {
    label: '无需建议',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    description: '一切正常，继续当前的养育方式',
  },
} as const

/**
 * 置信度配置
 */
export const CONFIDENCE_CONFIG = {
  high: {
    label: '高置信度',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    description: '明确的发展里程碑或典型行为',
  },
  medium: {
    label: '中置信度',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    description: '可能的阶段性表现，建议持续观察',
  },
  low: {
    label: '低置信度',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    description: '信息不足，建议记录更多观察细节',
  },
} as const
