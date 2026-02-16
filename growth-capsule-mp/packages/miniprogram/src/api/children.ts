import { request, uploadFile, isMockMode } from './client'
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
    try {
      return await request<ApiResponse<Child>>({ url: `/api/children/${id}` })
    } catch {
      const child = mockChildren.find(c => c.id === id)
      return mockResponse((child || mockChildren[0]) as Child)
    }
  },

  /** Create a new child */
  create: (data: { name: string; birthDate: string; gender: string }) =>
    request<ApiResponse<Child>>({
      url: '/api/children',
      method: 'POST',
      data,
    }),

  /** Update a child */
  update: (id: string, data: { name?: string; birthDate?: string; gender?: string }) =>
    request<ApiResponse<Child>>({
      url: `/api/children/${id}`,
      method: 'PUT',
      data,
    }),

  /** Delete a child */
  delete: (id: string) =>
    request<ApiResponse<null>>({
      url: `/api/children/${id}`,
      method: 'DELETE',
    }),

  /** Upload avatar */
  uploadAvatar: (childId: string, filePath: string) =>
    uploadFile({
      url: `/api/children/${childId}/avatar`,
      filePath,
      name: 'avatar',
    }),
}
