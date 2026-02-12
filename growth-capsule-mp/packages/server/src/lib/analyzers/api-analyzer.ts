import { Analyzer, GrowthAnalysisInput, GrowthAnalysisOutput, ParentingSuggestion, ConfidenceLevel } from './base'

/**
 * 外部 API 分析器
 * 支持两种 API 格式：
 * - OpenAI 兼容格式（DeepSeek、智谱GLM、通义千问、Moonshot、OpenAI 等）
 * - Anthropic 原生格式（Claude）
 *
 * 通过 endpoint URL 自动检测格式，也可通过 AI_API_FORMAT 手动指定
 */
export class ApiAnalyzer implements Analyzer {
  name = 'api-analyzer'
  priority = 10

  private apiKey: string
  private apiEndpoint: string
  private model: string
  private format: 'openai' | 'anthropic'

  constructor() {
    this.apiKey = process.env.AI_API_KEY || ''
    this.apiEndpoint = process.env.AI_API_ENDPOINT || ''
    this.model = process.env.AI_MODEL || ''
    this.format = this.detectFormat()
  }

  /**
   * 检测 API 格式
   * 优先使用 AI_API_FORMAT 环境变量，否则根据 endpoint 自动判断
   */
  private detectFormat(): 'openai' | 'anthropic' {
    const explicit = process.env.AI_API_FORMAT
    if (explicit === 'anthropic') return 'anthropic'
    if (explicit === 'openai') return 'openai'

    // 根据 endpoint URL 自动检测
    if (this.apiEndpoint.includes('anthropic.com')) return 'anthropic'
    return 'openai'
  }

  /**
   * 获取默认模型名
   */
  private getDefaultModel(): string {
    if (this.model) return this.model
    return this.format === 'anthropic' ? 'claude-sonnet-4-20250514' : 'gpt-4o'
  }

  async available(): Promise<boolean> {
    return !!this.apiKey && !!this.apiEndpoint
  }

  async analyze(input: GrowthAnalysisInput): Promise<GrowthAnalysisOutput> {
    try {
      const result = await this.callExternalAPI(input)
      return {
        ...result,
        source: 'api',
        confidenceLevel: result.confidenceLevel || 'high',
      }
    } catch (error) {
      throw new Error(`API analysis failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async callExternalAPI(input: GrowthAnalysisInput): Promise<Omit<GrowthAnalysisOutput, 'source'>> {
    const prompt = this.buildPrompt(input)
    const model = this.getDefaultModel()

    let responseText: string

    if (this.format === 'anthropic') {
      responseText = await this.callAnthropic(prompt, model)
    } else {
      responseText = await this.callOpenAICompatible(prompt, model)
    }

    return this.parseResponse(responseText)
  }

  /**
   * 调用 Anthropic API
   */
  private async callAnthropic(prompt: string, model: string): Promise<string> {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw new Error(`Anthropic API error ${response.status}: ${errorBody}`)
    }

    const data = await response.json()
    return data.content?.[0]?.text || ''
  }

  /**
   * 调用 OpenAI 兼容 API（DeepSeek / GLM / 通义千问 / Moonshot / OpenAI 等）
   */
  private async callOpenAICompatible(prompt: string, model: string): Promise<string> {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: '你是一位儿童发展心理学专家，擅长基于皮亚杰、维果茨基、埃里克森、鲍尔比等经典发展理论分析儿童行为。请严格按照用户要求的 JSON 格式返回结果，不要包含任何额外文字。',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw new Error(`API error ${response.status}: ${errorBody}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  }

  /**
   * 从 AI 返回的文本中解析 JSON 结果
   */
  private parseResponse(text: string): Omit<GrowthAnalysisOutput, 'source'> {
    // 尝试从 markdown code block 中提取 JSON
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim()

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      // 再尝试找到第一个 { 和最后一个 } 之间的内容
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      if (start === -1 || end === -1) {
        throw new Error('Failed to parse AI response as JSON')
      }
      parsed = JSON.parse(text.slice(start, end + 1))
    }

    // 验证并标准化返回结构
    const suggestions: ParentingSuggestion[] = Array.isArray(parsed.parentingSuggestions)
      ? parsed.parentingSuggestions.map((s: Record<string, unknown>) => ({
          type: (['observe', 'emotional', 'guidance', 'none'].includes(s.type as string)
            ? s.type
            : 'observe') as ParentingSuggestion['type'],
          content: String(s.content || ''),
          theoryReference: s.theoryReference ? String(s.theoryReference) : undefined,
          deepInsight: s.deepInsight ? String(s.deepInsight) : undefined,
        }))
      : []

    const confidence = (['high', 'medium', 'low'].includes(parsed.confidenceLevel as string)
      ? parsed.confidenceLevel
      : 'medium') as ConfidenceLevel

    return {
      developmentStage: String(parsed.developmentStage || ''),
      psychologicalInterpretation: String(parsed.psychologicalInterpretation || ''),
      emotionalInterpretation: parsed.emotionalInterpretation ? String(parsed.emotionalInterpretation) : undefined,
      parentingSuggestions: suggestions,
      milestone: parsed.milestone ? String(parsed.milestone) : undefined,
      confidenceLevel: confidence,
    }
  }

  private buildPrompt(input: GrowthAnalysisInput): string {
    const { childAge, behavior, context, category, childName, ageDescription, developmentStage } = input

    const categoryLabels: Record<string, string> = {
      motor: '运动发展',
      language: '语言发展',
      social: '社交能力',
      cognitive: '认知发展',
      emotional: '情感发展',
    }

    const ageLine = ageDescription
      ? `- 年龄：${ageDescription}（${childAge}个月），当前处于${developmentStage || '未知'}阶段`
      : `- 月龄：${childAge} 个月`

    return `请分析以下儿童行为，并严格以 JSON 格式返回分析结果（不要包含任何 JSON 之外的文字）。

儿童信息：
${childName ? `- 姓名：${childName}` : ''}
${ageLine}
- 行为类别：${categoryLabels[category] || category}
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
      "theoryReference": "理论出处",
      "deepInsight": "基于具体行为的深度洞察（100字左右）"
    }
  ],
  "milestone": "对应的发育里程碑（如果有）",
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
8. 【重要】描述年龄时必须使用"X岁Y个月"格式（如"7岁11个月"），绝对不要使用"XX个月大"的原始月龄表述
9. 【重要】引用皮亚杰阶段时必须准确：感知运动阶段（0-2岁）、前运算阶段（2-7岁）、具体运算阶段（7-11岁）、形式运算阶段（11岁+）
10. 【重要】引用埃里克森阶段时必须准确：信任vs不信任（0-1岁）、自主vs羞愧（1-3岁）、主动vs内疚（3-6岁）、勤奋vs自卑（6-12岁）、自我认同vs角色混淆（12-18岁）
`
  }
}
