/**
 * Mock data for offline/no-backend development.
 * Used when the API server is unreachable (e.g. preview mode without public URL).
 */

const now = new Date().toISOString()
const childId1 = 'mock-child-1'
const childId2 = 'mock-child-2'

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

const mockRecords = [
  {
    id: 'mock-record-1',
    childId: childId1,
    category: 'language',
    behavior: '今天第一次清楚地叫了"妈妈"，还指着妈妈的方向',
    date: daysAgo(0),
    ageInMonths: 14,
    notes: '',
    analysis: null,
    milestones: null,
    imageUrl: null,
    isFavorite: true,
    createdAt: daysAgo(0),
  },
  {
    id: 'mock-record-2',
    childId: childId1,
    category: 'motor',
    behavior: '独立走了5步，从沙发走到茶几',
    date: daysAgo(2),
    ageInMonths: 14,
    notes: '走路越来越稳了',
    analysis: null,
    milestones: null,
    imageUrl: null,
    isFavorite: false,
    createdAt: daysAgo(2),
  },
  {
    id: 'mock-record-3',
    childId: childId1,
    category: 'cognitive',
    behavior: '能指认出绘本上的小猫和小狗',
    date: daysAgo(5),
    ageInMonths: 14,
    notes: '',
    analysis: null,
    milestones: null,
    imageUrl: null,
    isFavorite: false,
    createdAt: daysAgo(5),
  },
  {
    id: 'mock-record-4',
    childId: childId2,
    category: 'social',
    behavior: '在公园主动和其他小朋友分享玩具铲子',
    date: daysAgo(1),
    ageInMonths: 38,
    notes: '',
    analysis: null,
    milestones: null,
    imageUrl: null,
    isFavorite: false,
    createdAt: daysAgo(1),
  },
  {
    id: 'mock-record-5',
    childId: childId2,
    category: 'emotional',
    behavior: '看动画片里小动物受伤的片段时说"它好可怜"',
    date: daysAgo(3),
    ageInMonths: 38,
    notes: '共情能力在发展',
    analysis: null,
    milestones: null,
    imageUrl: null,
    isFavorite: true,
    createdAt: daysAgo(3),
  },
]

export const mockChildren = [
  {
    id: childId1,
    name: '小橙子',
    birthDate: '2024-12-10',
    gender: 'female',
    avatarUrl: null,
    ownerUid: 'mock-uid',
    createdAt: '2024-12-10T00:00:00Z',
    updatedAt: now,
    records: mockRecords.filter(r => r.childId === childId1),
  },
  {
    id: childId2,
    name: '小柚子',
    birthDate: '2022-12-15',
    gender: 'male',
    avatarUrl: null,
    ownerUid: 'mock-uid',
    createdAt: '2022-12-15T00:00:00Z',
    updatedAt: now,
    records: mockRecords.filter(r => r.childId === childId2),
  },
]

export const mockRecordsList = mockRecords

/** Build a mock API response */
export function mockResponse<T>(data: T) {
  return { success: true as const, data }
}
