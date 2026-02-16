import { request, uploadFile, isMockMode } from './client'
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

export const childrenApi = {
  /** Fetch all children for the current user */
  list: async (): Promise<ApiResponse<Child[]>> => {
    if (isMockMode()) return mockResponse(mockChildren as Child[])

    // Cloud function path
    if (isCloudAvailable()) {
      try {
        return await callCloudFunction<ApiResponse<Child[]>>('children', {
          action: 'list',
        })
      } catch (error) {
        console.warn('Cloud children.list failed, falling back:', error)
      }
    }

    // HTTP fallback
    try {
      return await request<ApiResponse<Child[]>>({ url: '/api/children' })
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

    if (isCloudAvailable()) {
      try {
        return await callCloudFunction<ApiResponse<Child>>('children', {
          action: 'get',
          id,
        })
      } catch (error) {
        console.warn('Cloud children.get failed, falling back:', error)
      }
    }

    try {
      return await request<ApiResponse<Child>>({ url: `/api/children/${id}` })
    } catch {
      const child = mockChildren.find(c => c.id === id)
      return mockResponse((child || mockChildren[0]) as Child)
    }
  },

  /** Create a new child */
  create: async (data: { name: string; birthDate: string; gender: string }): Promise<ApiResponse<Child>> => {
    if (isCloudAvailable()) {
      try {
        return await callCloudFunction<ApiResponse<Child>>('children', {
          action: 'create',
          data,
        })
      } catch (error) {
        console.warn('Cloud children.create failed, falling back:', error)
      }
    }

    return request<ApiResponse<Child>>({
      url: '/api/children',
      method: 'POST',
      data,
    })
  },

  /** Update a child */
  update: async (id: string, data: { name?: string; birthDate?: string; gender?: string }): Promise<ApiResponse<Child>> => {
    if (isCloudAvailable()) {
      try {
        return await callCloudFunction<ApiResponse<Child>>('children', {
          action: 'update',
          id,
          data,
        })
      } catch (error) {
        console.warn('Cloud children.update failed, falling back:', error)
      }
    }

    return request<ApiResponse<Child>>({
      url: `/api/children/${id}`,
      method: 'PUT',
      data,
    })
  },

  /** Delete a child */
  delete: async (id: string): Promise<ApiResponse<null>> => {
    if (isCloudAvailable()) {
      try {
        return await callCloudFunction<ApiResponse<null>>('children', {
          action: 'delete',
          id,
        })
      } catch (error) {
        console.warn('Cloud children.delete failed, falling back:', error)
      }
    }

    return request<ApiResponse<null>>({
      url: `/api/children/${id}`,
      method: 'DELETE',
    })
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
        console.warn('Cloud avatar upload failed, falling back:', error)
      }
    }

    return uploadFile({
      url: `/api/children/${childId}/avatar`,
      filePath,
      name: 'avatar',
    })
  },
}
