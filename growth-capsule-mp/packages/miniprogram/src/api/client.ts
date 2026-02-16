import Taro from '@tarojs/taro'

// Development: point to local Next.js API server
// Production: point to deployed server URL
const BASE_URL = process.env.TARO_APP_API_URL || 'http://localhost:3001'

// Enable mock mode when no API URL is configured or API is unreachable
let useMock = !process.env.TARO_APP_API_URL

export function isMockMode(): boolean {
  return useMock
}

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
  header?: Record<string, string>
  showLoading?: boolean
  loadingText?: string
}

/**
 * Unified HTTP request wrapper.
 * Automatically attaches the JWT token from local storage.
 */
export async function request<T = unknown>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, header = {}, showLoading = false, loadingText = '加载中...' } = options

  if (showLoading) {
    Taro.showLoading({ title: loadingText })
  }

  try {
    const token = Taro.getStorageSync('auth_token') as string

    const res = await Taro.request<T>({
      url: `${BASE_URL}${url}`,
      method,
      data,
      timeout: 10000,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...header,
      },
    })

    if (showLoading) {
      Taro.hideLoading()
    }

    if (res.statusCode >= 400) {
      const errData = res.data as Record<string, unknown>
      const errMsg = (errData?.error as string) || (errData?.message as string) || `请求失败 (${res.statusCode})`
      throw new Error(errMsg)
    }

    return res.data
  } catch (error) {
    if (showLoading) {
      Taro.hideLoading()
    }
    throw error
  }
}

/**
 * Upload a file (image) to the server.
 * Uses Taro.uploadFile for multipart/form-data.
 */
export async function uploadFile(options: {
  url: string
  filePath: string
  name: string
  formData?: Record<string, string>
}): Promise<unknown> {
  const token = Taro.getStorageSync('auth_token') as string

  const res = await Taro.uploadFile({
    url: `${BASE_URL}${options.url}`,
    filePath: options.filePath,
    name: options.name,
    formData: options.formData,
    header: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (res.statusCode >= 400) {
    throw new Error(`上传失败 (${res.statusCode})`)
  }

  return JSON.parse(res.data as string)
}
