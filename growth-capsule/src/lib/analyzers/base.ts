/**
 * 成长分析器基础接口
 * 所有分析器都需要实现这个接口
 */

/**
 * 建议类型：区分不同的干预强度
 * - observe: 仅观察，无需干预
 * - emotional: 情绪支持，接纳和共情
 * - guidance: 可尝试引导，适度引导
 * - none: 无需建议
 */
export type SuggestionType = 'observe' | 'emotional' | 'guidance' | 'none'

/**
 * 单条养育建议
 */
export interface ParentingSuggestion {
  type: SuggestionType // 建议类型
  content: string // 建议内容
  theoryReference?: string // 理论出处（如：皮亚杰认知发展理论、埃里克森心理社会发展理论等）
  deepInsight?: string // 深度洞察（基于具体行为的挖掘）
}

/**
 * 分析置信度：反映判断的确定程度
 * - high: 高置信度 - 明确的发展里程碑或典型行为
 * - medium: 中置信度 - 可能的阶段性表现，需要更多观察
 * - low: 低置信度 - 信息不足或行为不典型，建议持续观察
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface GrowthAnalysisInput {
  childAge: number // 月龄
  behavior: string // 行为描述
  context?: string // 上下文信息
  category: string // 行为类别
}

export interface GrowthAnalysisOutput {
  developmentStage: string // 发展阶段
  psychologicalInterpretation: string // 心理学视角解读
  emotionalInterpretation?: string // 情感解读（面向父母的情绪共鸣）
  parentingSuggestions: ParentingSuggestion[] // 养育建议（带类型）
  milestone?: string // 对应的里程碑
  confidenceLevel: ConfidenceLevel // 置信度
  source: 'local' | 'api' // 数据来源
}

/**
 * @deprecated 使用 GrowthAnalysisOutput 替代
 * 保留用于向后兼容
 */
export interface LegacyGrowthAnalysisOutput {
  developmentStage: string
  psychologicalInterpretation: string
  parentingAdvice: string[]
  milestone?: string
  confidence: 'high' | 'medium' | 'low'
  source: 'local' | 'api'
}

export interface Analyzer {
  /**
   * 分析器名称
   */
  name: string

  /**
   * 分析器优先级（数字越大优先级越高）
   * 本地分析器优先级较低，外部 API 优先级较高
   */
  priority: number

  /**
   * 是否可用
   */
  available(): Promise<boolean> | boolean

  /**
   * 执行分析
   */
  analyze(input: GrowthAnalysisInput): Promise<GrowthAnalysisOutput>
}
