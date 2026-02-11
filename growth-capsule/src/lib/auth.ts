import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const DEFAULT_UID = 'uid_default_local'

/**
 * Get the current user's UID in Server Components.
 * Reads from cookies (set by DevUidSwitcher) or falls back to env / default.
 */
export function getServerUid(): string {
  try {
    const cookieStore = cookies()
    const cookieUid = cookieStore.get('dev-uid')?.value
    if (cookieUid && cookieUid.trim()) {
      return cookieUid.trim()
    }
  } catch {
    // cookies() may throw outside of request context
  }

  if (process.env.DEV_DEFAULT_UID) {
    return process.env.DEV_DEFAULT_UID
  }

  return DEFAULT_UID
}

/**
 * Get the current user's UID from the request context.
 *
 * Priority (highest → lowest):
 *   1. X-DEV-UID HTTP header  (curl / Postman / programmatic)
 *   2. dev-uid cookie          (browser dev toolbar)
 *   3. DEV_DEFAULT_UID env var (server-wide default)
 *   4. Fallback: uid_default_local
 */
export function getCurrentUid(request: NextRequest): string {
  // 1. Header
  const headerUid = request.headers.get('x-dev-uid')
  if (headerUid && headerUid.trim()) {
    return headerUid.trim()
  }

  // 2. Cookie
  const cookieUid = request.cookies.get('dev-uid')?.value
  if (cookieUid && cookieUid.trim()) {
    return cookieUid.trim()
  }

  // 3. Env var
  if (process.env.DEV_DEFAULT_UID) {
    return process.env.DEV_DEFAULT_UID
  }

  // 4. Fallback
  return DEFAULT_UID
}

/**
 * Verify resource ownership. Returns a 403 JSON response if the check fails,
 * or null if the caller is the owner.
 */
export function checkOwnership(
  resourceOwnerUid: string,
  currentUid: string
): NextResponse | null {
  if (resourceOwnerUid !== currentUid) {
    return NextResponse.json(
      {
        success: false,
        error: 'PERMISSION_DENIED',
        message: '无权访问此资源',
      },
      { status: 403 }
    )
  }
  return null
}

/**
 * Helper: build the upload directory path for a given user.
 */
export function getUserUploadDir(
  ownerUid: string,
  subdir: 'avatars' | 'records'
): string {
  const path = require('path')
  return path.join(process.cwd(), 'public', 'uploads', 'users', ownerUid, subdir)
}

/**
 * Helper: build the public URL for an uploaded file.
 */
export function getUserUploadUrl(
  ownerUid: string,
  subdir: 'avatars' | 'records',
  filename: string
): string {
  return `/uploads/users/${ownerUid}/${subdir}/${filename}`
}
