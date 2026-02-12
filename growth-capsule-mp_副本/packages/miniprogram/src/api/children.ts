import { request, uploadFile } from './client'

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
  list: () =>
    request<ApiResponse<Child[]>>({
      url: '/api/children',
    }),

  /** Get a single child by ID with records */
  get: (id: string) =>
    request<ApiResponse<Child>>({
      url: `/api/children/${id}`,
    }),

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
