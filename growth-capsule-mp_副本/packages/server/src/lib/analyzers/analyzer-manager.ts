import { Analyzer, GrowthAnalysisInput, GrowthAnalysisOutput, ParentingSuggestion, ConfidenceLevel } from './base'
import { LocalAnalyzer } from './local-analyzer'
import { ApiAnalyzer } from './api-analyzer'

/**
 * 成长分析器管理器
 *
 * 功能：
 * 1. 管理多个分析器（本地 + 外部 API）
 * 2. 按优先级选择分析器
 * 3. 自动 fallback 机制
 * 4. 永远返回成功结果（不抛 500 错误）
 */
export class AnalyzerManager {
  private analyzers: Analyzer[]

  constructor() {
    // 注册所有分析器（按优先级自动排序）
    this.analyzers = [
      new ApiAnalyzer(), // 优先使用外部 API
      new LocalAnalyzer(), // fallback 到本地分析器
    ].sort((a, b) => b.priority - a.priority)
  }

  /**
   * 执行分析
   * - 按优先级尝试分析器
   * - 自动 fallback 到本地分析器
   * - 永远返回成功结果
   */
  async analyze(input: GrowthAnalysisInput): Promise<GrowthAnalysisOutput> {
    const errors: Array<{ analyzer: string; error: string }> = []

    // 尝试每个分析器
    for (const analyzer of this.analyzers) {
      try {
        // 检查分析器是否可用
        const available = await analyzer.available()
        if (!available) {
          continue
        }

        // 执行分析
        const result = await analyzer.analyze(input)
        return result
      } catch (error) {
        // 记录错误，继续尝试下一个分析器
        errors.push({
          analyzer: analyzer.name,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // 所有分析器都失败了（理论上不应该发生，因为本地分析器始终可用）
    // 返回一个安全的降级结果
    return this.getFallbackResult(input)
  }

  /**
   * 获取降级结果
   * 当所有分析器都失败时返回
   */
  private getFallbackResult(input: GrowthAnalysisInput): GrowthAnalysisOutput {
    const suggestions: ParentingSuggestion[] = [
      { type: 'observe', content: '提供安全、支持性的环境' },
      { type: 'observe', content: '观察孩子的反应和兴趣' },
      { type: 'guidance', content: '适时给予鼓励和引导' },
    ]

    return {
      developmentStage: `${input.childAge} 个月`,
      psychologicalInterpretation: '已记录此行为。持续观察可以帮助了解孩子的发展轨迹。',
      parentingSuggestions: suggestions,
      confidenceLevel: 'low',
      source: 'local',
    }
  }

  /**
   * 获取可用的分析器列表
   */
  async getAvailableAnalyzers(): Promise<Array<{ name: string; available: boolean }>> {
    const status = await Promise.all(
      this.analyzers.map(async (analyzer) => ({
        name: analyzer.name,
        available: await analyzer.available(),
      }))
    )
    return status
  }
}

// 导出单例
export const analyzerManager = new AnalyzerManager()
