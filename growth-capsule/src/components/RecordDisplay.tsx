'use client'

import { useState } from 'react'
import { BEHAVIOR_CATEGORIES } from '@/types'

interface Record {
  id: string
  category: string
  behavior: string
  date: Date
  ageInMonths: number
  notes?: string | null
  analysis?: string | null
  milestones?: string | null
}

interface RecordDisplayProps {
  records: Record[]
  renderRecord: (record: Record) => React.ReactNode
}

export function RecordDisplay({ records, renderRecord }: RecordDisplayProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // 筛选记录
  const filteredRecords = selectedCategory
    ? records.filter(r => r.category === selectedCategory)
    : records

  return (
    <>
      {/* 筛选器 */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          全部 ({records.length})
        </button>
        {BEHAVIOR_CATEGORIES.map((cat) => {
          const count = records.filter(r => r.category === cat.value).length
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat.icon} {cat.label} ({count})
            </button>
          )
        })}
      </div>

      {/* 显示筛选后的记录 */}
      <div className="space-y-6">
        {filteredRecords.map((record) => (
          <div key={record.id}>
            {renderRecord(record)}
          </div>
        ))}
      </div>
    </>
  )
}
