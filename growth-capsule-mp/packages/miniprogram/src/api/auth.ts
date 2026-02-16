import Taro from '@tarojs/taro'
import { callCloudFunction, isCloudAvailable } from './cloud'
import { request } from './client'

interface LoginResponse {
  success: boolean
  token?: string
  uid?: string
}

interface CloudLoginResult {
  success: boolean
  data: { openid: string; isNew: boolean }
}

/**
 * Perform login via cloud function (preferred) or HTTP fallback.
 * Cloud functions use WeChat OpenID automatically — no JWT needed.
 */
export async function wechatLogin(): Promise<LoginResponse> {
  // Prefer cloud function
  if (isCloudAvailable()) {
    try {
      const result = await callCloudFunction<CloudLoginResult>('user', {
        action: 'ensureLogin',
      })

      if (result.success) {
        Taro.setStorageSync('uid', result.data.openid)
        Taro.setStorageSync('auth_mode', 'cloud')
        return { success: true, uid: result.data.openid }
      }
    } catch (error) {
      console.warn('Cloud login failed, falling back to HTTP:', error)
    }
  }

  // Fallback: HTTP login with code exchange
  const { code } = await Taro.login()
  const result = await request<LoginResponse>({
    url: '/api/auth/wechat-login',
    method: 'POST',
    data: { code },
  })

  if (result.success && result.token) {
    Taro.setStorageSync('auth_token', result.token)
    Taro.setStorageSync('uid', result.uid)
    Taro.setStorageSync('auth_mode', 'http')
  }

  return result
}

/**
 * Ensure the user is logged in.
 * Called on app launch — silently logs in if no cached session.
 */
export async function ensureLogin(): Promise<void> {
  const uid = Taro.getStorageSync('uid')
  if (!uid) {
    try {
      await wechatLogin()
    } catch (error) {
      console.error('Auto-login failed:', error)
    }
  }
}

/**
 * Get the current auth token (HTTP mode only), or null.
 */
export function getToken(): string | null {
  return Taro.getStorageSync('auth_token') || null
}

/**
 * Check if we're using cloud auth mode.
 */
export function isCloudAuth(): boolean {
  return Taro.getStorageSync('auth_mode') === 'cloud'
}

/**
 * Clear auth state (logout).
 */
export function logout(): void {
  Taro.removeStorageSync('auth_token')
  Taro.removeStorageSync('uid')
  Taro.removeStorageSync('auth_mode')
}
