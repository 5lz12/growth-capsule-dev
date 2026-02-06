import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { analyzerManager } from '@/lib/analyzers/analyzer-manager'

/**
 * GET /api/children/[id]/records
 * 获取孩子的所有记录
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const records = await prisma.record.findMany({
      where: { childId: params.id },
      orderBy: { date: 'desc' },
    })

    // 解析结构化分析数据（兼容历史记录）
    const recordsWithAnalysis = records.map(record => {
      let structuredAnalysis = undefined
      if (record.analysis) {
        try {
          // 尝试解析存储的 JSON 结构化数据
          const parsed = JSON.parse(record.analysis)
          if (parsed.parentingSuggestions) {
            structuredAnalysis = parsed
          }
        } catch {
          // 历史记录使用纯文本格式，保持不变
        }
      }
      return {
        ...record,
        structuredAnalysis,
      }
    })

    return NextResponse.json({
      success: true,
      data: recordsWithAnalysis,
    })
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch records',
    })
  }
}

/**
 * POST /api/children/[id]/records
 * 创建新记录（带自动分析）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { category, behavior, date, notes } = body

    // 验证必填字段
    if (!category || !behavior || !date) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: category, behavior, date',
      })
    }

    // 获取孩子信息计算月龄
    const child = await prisma.child.findUnique({
      where: { id: params.id },
    })

    if (!child) {
      return NextResponse.json({
        success: false,
        error: 'Child not found',
      })
    }

    // 计算月龄
    const recordDate = new Date(date)
    const birthDate = new Date(child.birthDate)
    const ageInMonths = Math.floor(
      (recordDate.getTime() - birthDate.getTime()) /
        (1000 * 60 * 60 * 24 * 30.44)
    )

    // 使用分析器进行心理学分析（自动选择最佳分析器）
    const analysisResult = await analyzerManager.analyze({
      childAge: ageInMonths,
      behavior,
      context: notes,
      category,
    })

    // 将结构化分析数据序列化为 JSON 存储
    const structuredAnalysis = {
      developmentStage: analysisResult.developmentStage,
      psychologicalInterpretation: analysisResult.psychologicalInterpretation,
      parentingSuggestions: analysisResult.parentingSuggestions,
      milestone: analysisResult.milestone,
      confidenceLevel: analysisResult.confidenceLevel,
      source: analysisResult.source,
    }

    // 生成纯文本版本的分析（用于向后兼容显示）
    const textAnalysis = [
      `【发展阶段】${structuredAnalysis.developmentStage}`,
      ``,
      `【心理解读】${structuredAnalysis.psychologicalInterpretation}`,
      structuredAnalysis.milestone ? `\n【里程碑】${structuredAnalysis.milestone}` : '',
      ``,
      `【养育建议】`,
      ...structuredAnalysis.parentingSuggestions.map(s => {
        const typeLabel = {
          observe: '👁️ 持续观察',
          emotional: '💙 情绪支持',
          guidance: '🌱 适度引导',
          none: '✅ 无需建议',
        }[s.type]
        return `${typeLabel}：${s.content}`
      }),
    ].filter(Boolean).join('\n')

    // 创建记录
    const record = await prisma.record.create({
      data: {
        childId: params.id,
        category,
        behavior,
        date: recordDate,
        ageInMonths,
        notes,
        analysis: textAnalysis,
        milestones: analysisResult.milestone,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        record: {
          ...record,
          structuredAnalysis,
        },
        analysisSource: analysisResult.source,
        confidenceLevel: analysisResult.confidenceLevel,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create record',
    })
  }
}
