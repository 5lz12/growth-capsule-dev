import { NextRequest, NextResponse } from 'next/server'
import { analyzerManager } from '@/lib/analyzers/analyzer-manager'
import { z } from 'zod'

// 请求验证 schema
const analyzeRequestSchema = z.object({
  childAge: z.number().int().positive(),
  behavior: z.string().min(1),
  category: z.string().min(1),
  context: z.string().optional(),
})

/**
 * POST /api/analyze
 * 成长行为分析 API
 *
 * 设计原则：
 * 1. 永远返回 success = true，不抛 500 错误
 * 2. 优先使用外部 API（如果可用）
 * 3. 自动 fallback 到本地分析器
 * 4. 返回结构化的分析结果
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求
    const body = await request.json()

    // 验证请求
    const validation = analyzeRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        success: true,
        error: 'Invalid request format',
        details: validation.error.errors,
      })
    }

    const input = validation.data

    // 执行分析（自动选择分析器 + 自动 fallback）
    const result = await analyzerManager.analyze(input)

    // 返回成功结果
    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    // 理论上不会到达这里（本地分析器始终可用）
    // 但为了安全，返回一个安全的错误响应
    return NextResponse.json({
      success: true,
      data: {
        developmentStage: '未知',
        psychologicalInterpretation: '分析暂时不可用，请稍后重试。',
        parentingAdvice: [
          '持续观察孩子的成长变化',
          '提供安全和支持的环境',
          '如有疑虑，咨询专业人士',
        ],
        confidence: 'low' as const,
        source: 'local' as const,
      },
    })
  }
}

/**
 * GET /api/analyze
 * 获取分析器状态
 */
export async function GET() {
  const availableAnalyzers = await analyzerManager.getAvailableAnalyzers()

  return NextResponse.json({
    success: true,
    data: {
      analyzers: availableAnalyzers,
      current: availableAnalyzers.find((a) => a.available)?.name || 'none',
    },
  })
}
