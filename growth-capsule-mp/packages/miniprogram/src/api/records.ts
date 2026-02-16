import { request, RequestOptions } from './client'
import { callCloudFunction, isCloudAvailable } from './cloud'

export interface Record {
  id: string
  childId: string
  category: string
  behavior: string
  date: string
  ageInMonths: number
  notes?: string
  analysis?: string
  milestones?: string
  analysisStatus?: 'pending' | 'analyzing' | 'done' | 'failed'
  imageUrl?: string
  isFavorite: boolean
  createdAt: string
  // Extra fields populated by API
  childName?: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

/**
 * Cloud-primary, HTTP-fallback-only-when-unavailable helper.
 * If cloud is available, calls the cloud function and re-throws on failure.
 * If cloud is unavailable, falls back to HTTP.
 */
async function cloudOrHttp<T>(
  cloudData: { action: string; [key: string]: unknown },
  httpOptions: RequestOptions
): Promise<T> {
  if (isCloudAvailable()) {
    try {
      return await callCloudFunction<T>('records', cloudData)
    } catch (error) {
      console.error(`Cloud records/${cloudData.action} error:`, error)
      throw error
    }
  }

  return request<T>(httpOptions)
}

export const recordsApi = {
  /** Get a record by ID */
  getById: async (id: string): Promise<ApiResponse<Record>> => {
    return cloudOrHttp<ApiResponse<Record>>(
      { action: 'get', id },
      { url: `/api/records/${id}` }
    )
  },

  /** Get records for a child */
  list: async (childId: string): Promise<ApiResponse<Record[]>> => {
    return cloudOrHttp<ApiResponse<Record[]>>(
      { action: 'list', childId },
      { url: `/api/children/${childId}/records` }
    )
  },

  /** Create a record */
  create: async (childId: string, data: {
    category: string
    behavior: string
    date: string
    ageInMonths: number
    notes?: string
  }): Promise<ApiResponse<Record>> => {
    return cloudOrHttp<ApiResponse<Record>>(
      { action: 'create', childId, data },
      { url: `/api/children/${childId}/records`, method: 'POST', data }
    )
  },

  /** Update a record */
  update: async (id: string, data: {
    category?: string
    behavior?: string
    date?: string
    ageInMonths?: number
    notes?: string
  }): Promise<ApiResponse<Record>> => {
    return cloudOrHttp<ApiResponse<Record>>(
      { action: 'update', id, data },
      { url: `/api/records/${id}`, method: 'PUT', data }
    )
  },

  /** Toggle favorite */
  toggleFavorite: async (id: string): Promise<ApiResponse<{ isFavorite: boolean }>> => {
    return cloudOrHttp<ApiResponse<{ isFavorite: boolean }>>(
      { action: 'toggleFavorite', id },
      { url: `/api/records/${id}/favorite`, method: 'PUT' }
    )
  },

  /** Delete a record */
  delete: async (id: string): Promise<ApiResponse<null>> => {
    return cloudOrHttp<ApiResponse<null>>(
      { action: 'delete', id },
      { url: `/api/records/${id}`, method: 'DELETE' }
    )
  },
}
