import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/children/[id]
 * 获取单个孩子的详细信息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const child = await prisma.child.findUnique({
      where: { id: params.id },
      include: {
        records: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!child) {
      return NextResponse.json({
        success: true,
        data: null,
        error: 'Child not found',
      })
    }

    return NextResponse.json({
      success: true,
      data: child,
    })
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch child',
    })
  }
}
