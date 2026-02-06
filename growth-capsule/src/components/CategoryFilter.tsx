'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { BEHAVIOR_CATEGORIES } from '@/types'

interface CategoryFilterProps {
  records: any[]
}

export function CategoryFilter({ records }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category')

  const setCategory = (category: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category) {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
      <button
        onClick={() => setCategory(null)}
        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
          currentCategory === null
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
        }`}
      >
        全部 ({records.length})
      </button>
      {BEHAVIOR_CATEGORIES.map((cat) => {
        const count = records.filter((r: any) => r.category === cat.value).length
        return (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              currentCategory === cat.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {cat.icon} {cat.label} ({count})
          </button>
        )
      })}
    </div>
  )
}
