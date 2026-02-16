import { request, RequestOptions, uploadFile, isMockMode } from './client'
import { callCloudFunction, isCloudAvailable, uploadCloudFile } from './cloud'
import { mockChildren, mockResponse } from './mock-data'

export interface Child {
  id: string
  name: string
  birthDate: string
  gender: string
  avatarUrl?: string
  ownerUid: string
  createdAt: string
  updatedAt: string
  records?: ChildRecord[]
}

export interface ChildRecord {
  id: string
  childId: string
  category: string
  behavior: string
  date: string
  ageInMonths: number
  notes?: string
  analysis?: string
  milestones?: string
  imageUrl?: string
  isFavorite: boolean
  createdAt: string
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
      return await callCloudFunction<T>('children', cloudData)
    } catch (error) {
      console.error(`Cloud children/${cloudData.action} error:`, error)
      throw error
    }
  }

  return request<T>(httpOptions)
}

export const childrenApi = {
  /** Fetch all children for the current user */
  list: async (): Promise<ApiResponse<Child[]>> => {
    if (isMockMode()) return mockResponse(mockChildren as Child[])

    try {
      return await cloudOrHttp<ApiResponse<Child[]>>(
        { action: 'list' },
        { url: '/api/children' }
      )
    } catch {
      return mockResponse(mockChildren as Child[])
    }
  },

  /** Get a single child by ID with records */
  get: async (id: string): Promise<ApiResponse<Child>> => {
    if (isMockMode()) {
      const child = mockChildren.find(c => c.id === id)
      return mockResponse((child || mockChildren[0]) as Child)
    }

    try {
      return await cloudOrHttp<ApiResponse<Child>>(
        { action: 'get', id },
        { url: `/api/children/${id}` }
      )
    } catch {
      const child = mockChildren.find(c => c.id === id)
      return mockResponse((child || mockChildren[0]) as Child)
    }
  },

  /** Create a new child */
  create: async (data: { name: string; birthDate: string; gender: string }): Promise<ApiResponse<Child>> => {
    return cloudOrHttp<ApiResponse<Child>>(
      { action: 'create', data },
      { url: '/api/children', method: 'POST', data }
    )
  },

  /** Update a child */
  update: async (id: string, data: { name?: string; birthDate?: string; gender?: string }): Promise<ApiResponse<Child>> => {
    return cloudOrHttp<ApiResponse<Child>>(
      { action: 'update', id, data },
      { url: `/api/children/${id}`, method: 'PUT', data }
    )
  },

  /** Delete a child */
  delete: async (id: string): Promise<ApiResponse<null>> => {
    return cloudOrHttp<ApiResponse<null>>(
      { action: 'delete', id },
      { url: `/api/children/${id}`, method: 'DELETE' }
    )
  },

  /** Upload avatar — cloud storage or HTTP */
  uploadAvatar: async (childId: string, filePath: string): Promise<unknown> => {
    if (isCloudAvailable()) {
      try {
        const cloudPath = `avatars/${childId}/${Date.now()}.jpg`
        const fileID = await uploadCloudFile({ cloudPath, filePath })
        return await callCloudFunction('children', {
          action: 'updateAvatar',
          id: childId,
          fileId: fileID,
        })
      } catch (error) {
        console.error('Cloud avatar upload error:', error)
        throw error
      }
    }

    return uploadFile({
      url: `/api/children/${childId}/avatar`,
      filePath,
      name: 'avatar',
    })
  },
}
