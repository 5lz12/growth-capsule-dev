import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUid } from '@/lib/auth'

/**
 * POST /api/dev/switch-uid
 * Set the dev-uid cookie for browser-based UID switching.
 * Body: { uid: string }
 *
 * GET /api/dev/switch-uid
 * Return the current effective UID.
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { uid } = body

  if (!uid || typeof uid !== 'string') {
    return NextResponse.json({ error: 'uid is required' }, { status: 400 })
  }

  const response = NextResponse.json({ success: true, uid })

  // Set cookie (httpOnly=false so client JS can read it for display)
  response.cookies.set('dev-uid', uid, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false,
    sameSite: 'lax',
  })

  return response
}

export async function GET(request: NextRequest) {
  const uid = getCurrentUid(request)
  return NextResponse.json({ uid })
}
