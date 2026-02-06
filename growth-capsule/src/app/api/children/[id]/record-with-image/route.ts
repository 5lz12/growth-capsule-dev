import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { analyzerManager } from '@/lib/analyzers/analyzer-manager'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { category, behavior, date, notes, imageUrl } = body

    if (!category || !behavior || !date) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 获取孩子信息
    const child = await prisma.child.findUnique({
      where: { id: params.id },
    })

    if (!child) {
      return NextResponse.json(
        { error: '孩子不存在' },
        { status: 404 }
      )
    }

    // 计算月龄
    const recordDate = new Date(date)
    const birthDate = new Date(child.birthDate)
    const ageInMonths = Math.floor(
      (recordDate.getTime() - birthDate.getTime()) /
        (1000 * 60 * 60 * 24 * 30.44)
    )

    // 使用分析器生成分析
    const analysisResult = await analyzerManager.analyze({
      childAge: ageInMonths,
      behavior,
      context: notes,
      category,
    })

    // 保存结构化JSON格式
    const structuredAnalysis = JSON.stringify(analysisResult)

    // 创建记录
    const record = await prisma.record.create({
      data: {
        childId: child.id,
        category,
        behavior,
        date: recordDate,
        ageInMonths,
        notes,
        analysis: structuredAnalysis,
        milestones: analysisResult.milestone,
        imageUrl,
      },
    })

    return NextResponse.json({ success: true, recordId: record.id })
  } catch (error) {
    console.error('Create record error:', error)
    return NextResponse.json(
      { error: '创建记录失败' },
      { status: 500 }
    )
  }
}
