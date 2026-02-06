import { Analyzer, GrowthAnalysisInput, GrowthAnalysisOutput, ParentingSuggestion, ConfidenceLevel } from './base'

/**
 * 外部 API 分析器（示例架构）
 * 将来可以接入 GLM / Claude 等外部 AI API
 *
 * 使用方法：
 * 1. 配置环境变量 API_KEY、API_ENDPOINT
 * 2. 实现 callExternalAPI 方法
 * 3. 在 analyzer-manager.ts 中注册此分析器
 */
export class ApiAnalyzer implements Analyzer {
  name = 'api-analyzer'
  priority = 10 // 高优先级，优先使用

  private apiKey: string
  private apiEndpoint: string

  constructor() {
    this.apiKey = process.env.AI_API_KEY || ''
    this.apiEndpoint = process.env.AI_API_ENDPOINT || ''
  }

  async available(): Promise<boolean> {
    // 检查是否配置了 API 密钥
    return !!this.apiKey && !!this.apiEndpoint
  }

  async analyze(input: GrowthAnalysisInput): Promise<GrowthAnalysisOutput> {
    try {
      // 调用外部 API
      const externalResult = await this.callExternalAPI(input)

      // 标准化返回结果
      return {
        ...externalResult,
        source: 'api',
        confidenceLevel: externalResult.confidenceLevel || 'high',
      }
    } catch (error) {
      // API 调用失败，抛出错误让上层处理
      throw new Error(`API analysis failed: ${error}`)
    }
  }

  /**
   * 调用外部 AI API
   * 这里是一个示例实现，需要根据具体 API 修改
   */
  private async callExternalAPI(input: GrowthAnalysisInput): Promise<Omit<GrowthAnalysisOutput, 'source'>> {
    const prompt = this.buildPrompt(input)

    // 示例：调用 Claude API
    // const response = await fetch(this.apiEndpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'x-api-key': this.apiKey,
    //     'anthropic-version': '2023-06-01',
    //   },
    //   body: JSON.stringify({
    //     model: 'claude-3-sonnet-20240229',
    //     max_tokens: 1024,
    //     messages: [
    //       {
    //         role: 'user',
    //         content: prompt,
    //       },
    //     ],
    //   }),
    // })

    // const data = await response.json()
    // const result = JSON.parse(data.content[0].text)
    // return result

    // 临时实现：抛出错误提示需要配置
    throw new Error('External API not configured. Please set AI_API_KEY and AI_API_ENDPOINT environment variables.')
  }

  private buildPrompt(input: GrowthAnalysisInput): string {
    const { childAge, behavior, context, category } = input

    return `
你是一位儿童发展心理学专家。请分析以下儿童行为，并以 JSON 格式返回分析结果。

儿童信息：
- 月龄：${childAge} 个月
- 行为类别：${category}
- 行为描述：${behavior}
- 上下文：${context || '无'}

请返回以下格式的 JSON：
{
  "developmentStage": "发展阶段描述",
  "psychologicalInterpretation": "基于发展心理学的专业解读（200字左右），需引用具体理论如皮亚杰、维果茨基、埃里克森等",
  "emotionalInterpretation": "面向父母的情感共鸣型解读（100字左右）",
  "parentingSuggestions": [
    {
      "type": "observe|emotional|guidance|none",
      "content": "建议内容",
      "theoryReference": "理论出处（必须明确指出是哪个理论，如：皮亚杰认知发展理论、维果茨基最近发展区理论、埃里克森心理社会发展理论、鲍尔比依恋理论、蒙台梭利吸收性心智理论、托马斯与切斯气质理论等）",
      "deepInsight": "基于具体行为的深度洞察（100字左右，揭示行为背后的深层意义）"
    }
  ],
  "milestone": "对应的发育里程碑",
  "confidenceLevel": "high|medium|low"
}

建议类型说明：
- observe: 持续观察，无需干预
- emotional: 提供情绪支持，接纳和共情
- guidance: 适度引导，但不强迫
- none: 一切正常，无需建议

要求：
1. 基于皮亚杰、维果茨基、埃里克森、鲍尔比、蒙台梭利、托马斯与切斯等经典发展理论
2. 每条建议必须明确标注理论出处
3. 深度洞察要结合具体行为，揭示现象背后的深层机制
4. 分析要克制，不夸大，避免给家长造成焦虑
5. 大部分情况下应该是 observe 类型，强调"无需特殊干预"
6. 建议要实用、可操作，避免空泛
7. 考虑月龄特点，给出符合发展规律的分析
`
  }
}
