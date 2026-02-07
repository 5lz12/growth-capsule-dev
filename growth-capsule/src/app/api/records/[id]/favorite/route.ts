import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * POST /api/records/[id]/favorite
 * 切换记录的收藏状态
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const record = await prisma.record.findUnique({
      where: { id: params.id },
    })

    if (!record) {
      return NextResponse.json({
        success: false,
        error: 'Record not found',
      }, { status: 404 })
    }

    // 切换收藏状态
    const updatedRecord = await prisma.record.update({
      where: { id: params.id },
      data: {
        isFavorite: !record.isFavorite,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        isFavorite: updatedRecord.isFavorite,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle favorite',
    }, { status: 500 })
  }
}
