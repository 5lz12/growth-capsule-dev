import { Analyzer, GrowthAnalysisInput, GrowthAnalysisOutput, ParentingSuggestion } from './base'

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

  constructor(analyzers: Analyzer[]) {
    // 按优先级排序（高优先级在前）
    this.analyzers = [...analyzers].sort((a, b) => b.priority - a.priority)
  }

  /**
   * 执行分析
   * - 按优先级尝试分析器
   * - 自动 fallback 到本地分析器
   * - 永远返回成功结果
   */
  async analyze(input: GrowthAnalysisInput): Promise<GrowthAnalysisOutput> {
    const errors: Array<{ analyzer: string; error: string }> = []

    for (const analyzer of this.analyzers) {
      try {
        const available = await analyzer.available()
        if (!available) {
          continue
        }

        const result = await analyzer.analyze(input)
        return result
      } catch (error) {
        errors.push({
          analyzer: analyzer.name,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // 所有分析器都失败了，返回降级结果
    return this.getFallbackResult(input)
  }

  /**
   * 获取降级结果
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
