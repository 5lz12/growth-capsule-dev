import Taro from '@tarojs/taro'
import { request } from './client'

interface LoginResponse {
  success: boolean
  token: string
  uid: string
}

/**
 * Perform WeChat login and get a JWT token from our backend.
 */
export async function wechatLogin(): Promise<LoginResponse> {
  const { code } = await Taro.login()

  const result = await request<LoginResponse>({
    url: '/api/auth/wechat-login',
    method: 'POST',
    data: { code },
  })

  if (result.success && result.token) {
    Taro.setStorageSync('auth_token', result.token)
    Taro.setStorageSync('uid', result.uid)
  }

  return result
}

/**
 * Ensure the user is logged in.
 * Called on app launch — silently logs in if no token exists.
 */
export async function ensureLogin(): Promise<void> {
  const token = Taro.getStorageSync('auth_token')
  if (!token) {
    try {
      await wechatLogin()
    } catch (error) {
      console.error('Auto-login failed:', error)
      // Will retry on next API call
    }
  }
}

/**
 * Get the current auth token, or null if not logged in.
 */
export function getToken(): string | null {
  return Taro.getStorageSync('auth_token') || null
}

/**
 * Clear auth state (logout).
 */
export function logout(): void {
  Taro.removeStorageSync('auth_token')
  Taro.removeStorageSync('uid')
}
