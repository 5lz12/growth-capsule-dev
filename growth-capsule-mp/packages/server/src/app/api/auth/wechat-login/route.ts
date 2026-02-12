import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { wechatCode2Session } from '@/lib/wechat'

/**
 * POST /api/auth/wechat-login
 *
 * Exchange a wx.login() code for a JWT token.
 *
 * Request body: { code: string }
 * Response:     { success: true, token: string, uid: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid code' },
        { status: 400 }
      )
    }

    // Exchange code for openid via WeChat API
    const { openid } = await wechatCode2Session(code)

    // Find existing user by openid, or create a new one
    let user = await prisma.user.findFirst({
      where: {
        externalIds: { contains: openid },
      },
    })

    if (!user) {
      const uid = `wx_${openid.slice(0, 20)}_${Date.now().toString(36)}`
      user = await prisma.user.create({
        data: {
          uid,
          externalIds: JSON.stringify({ openid }),
        },
      })
    }

    // Sign a JWT
    const token = signToken({ uid: user.uid })

    return NextResponse.json({
      success: true,
      token,
      uid: user.uid,
    })
  } catch (error) {
    console.error('WeChat login error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      },
      { status: 500 }
    )
  }
}
