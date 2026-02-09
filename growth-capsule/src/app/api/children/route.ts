import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUid } from '@/lib/auth'

/**
 * GET /api/children
 * 获取当前用户的所有孩子列表
 */
export async function GET(request: NextRequest) {
  try {
    const uid = getCurrentUid(request)

    const children = await prisma.child.findMany({
      where: { ownerUid: uid },
      include: {
        records: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: children,
    })
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch children',
    })
  }
}

/**
 * POST /api/children
 * 创建新孩子（绑定当前用户）
 */
export async function POST(request: NextRequest) {
  try {
    const uid = getCurrentUid(request)
    const body = await request.json()
    const { name, birthDate, gender } = body

    if (!name || !birthDate || !gender) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, birthDate, gender',
      })
    }

    const child = await prisma.child.create({
      data: {
        name,
        birthDate: new Date(birthDate),
        gender,
        ownerUid: uid,
      },
    })

    return NextResponse.json({
      success: true,
      data: child,
    })
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create child',
    })
  }
}
