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
 * Perform login via cloud function (primary) or HTTP (when cloud unavailable).
 * Cloud functions use WeChat OpenID automatically — no JWT needed.
 * If cloud is available and fails, the error is re-thrown (no silent fallback).
 */
export async function wechatLogin(): Promise<LoginResponse> {
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

      throw new Error('Cloud login returned success: false')
    } catch (error) {
      console.error('Cloud user/ensureLogin error:', error)
      throw error
    }
  }

  // HTTP fallback — only when cloud is unavailable
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
