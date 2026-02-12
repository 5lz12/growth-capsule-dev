import { request } from './client'

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

export const recordsApi = {
  /** Get a record by ID */
  getById: (id: string) =>
    request<ApiResponse<Record>>({
      url: `/api/records/${id}`,
    }),

  /** Get records for a child */
  list: (childId: string) =>
    request<ApiResponse<Record[]>>({
      url: `/api/children/${childId}/records`,
    }),

  /** Create a record */
  create: (childId: string, data: {
    category: string
    behavior: string
    date: string
    ageInMonths: number
    notes?: string
  }) =>
    request<ApiResponse<Record>>({
      url: `/api/children/${childId}/records`,
      method: 'POST',
      data,
    }),

  /** Update a record */
  update: (id: string, data: {
    category?: string
    behavior?: string
    date?: string
    ageInMonths?: number
    notes?: string
  }) =>
    request<ApiResponse<Record>>({
      url: `/api/records/${id}`,
      method: 'PUT',
      data,
    }),

  /** Toggle favorite */
  toggleFavorite: (id: string) =>
    request<ApiResponse<{ isFavorite: boolean }>>({
      url: `/api/records/${id}/favorite`,
      method: 'PUT',
    }),

  /** Delete a record */
  delete: (id: string) =>
    request<ApiResponse<null>>({
      url: `/api/records/${id}`,
      method: 'DELETE',
    }),
}
