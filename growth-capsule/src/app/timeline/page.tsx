import Link from 'next/link'
import prisma from '@/lib/prisma'
import { BEHAVIOR_CATEGORIES } from '@/types'
import { formatAge } from '@/lib/utils'
import { TimelineCategoryFilter } from './components/TimelineCategoryFilter'

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: { childId?: string; category?: string }
}) {
  // 获取所有孩子
  const children = await prisma.child.findMany({
    orderBy: { createdAt: 'asc' },
  })

  if (children.length === 0) {
    return (
      <div className="min-h-screen">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-800">成长时光轴</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-400">还没有记录，先去添加一个孩子吧</p>
          <Link href="/children/new" className="inline-block mt-4 px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
            添加孩子
          </Link>
        </main>
      </div>
    )
  }

  // 确定当前选择的孩子
  const selectedChildId = searchParams.childId || children[0].id
  const selectedChild = children.find(c => c.id === selectedChildId) || children[0]

  // 获取该孩子的所有记录
  const records = await prisma.record.findMany({
    where: { childId: selectedChild.id },
    orderBy: { date: 'desc' },
  })

  // 分类筛选
  const categoryFilter = searchParams.category || null
  const filteredRecords = categoryFilter
    ? records.filter(r => r.category === categoryFilter)
    : records

  // 按日期分组
  const groupedRecords = groupByDate(filteredRecords)

  return (
    <div className="min-h-screen">
      {/* 顶部标题 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">成长时光轴</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* 孩子切换器（多个孩子时显示） */}
        {children.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/timeline?childId=${child.id}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  child.id === selectedChild.id
                    ? 'bg-brand-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{child.gender === 'male' ? '👦' : '👧'}</span>
                <span className="text-sm font-medium">{child.name}</span>
              </Link>
            ))}
          </div>
        )}

        {/* 分类筛选 */}
        <TimelineCategoryFilter
          records={records}
          childId={selectedChild.id}
        />

        {/* 时光轴内容 */}
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">还没有成长记录</p>
            <Link
              href={`/children/${selectedChild.id}/record`}
              className="inline-block px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              记录第一个瞬间
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* 时间线竖线 */}
            <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-brand-100" />

            {Object.entries(groupedRecords).map(([dateKey, dateRecords]) => (
              <div key={dateKey} className="mb-8">
                {/* 日期分组标题 */}
                <div className="flex items-center gap-3 mb-4 relative">
                  <div className="w-[37px] flex justify-center relative z-10">
                    <div className="w-3 h-3 rounded-full bg-brand-400 border-2 border-white shadow-sm" />
                  </div>
                  <span className="text-sm font-semibold text-brand-700">
                    {formatDateGroup(dateKey)}
                  </span>
                </div>

                {/* 该日期下的记录卡片 */}
                <div className="space-y-3 ml-[37px]">
                  {dateRecords.map((record: any) => {
                    const categoryInfo = BEHAVIOR_CATEGORIES.find(c => c.value === record.category)

                    // 检查是否有结构化分析
                    let hasAnalysis = false
                    if (record.analysis) {
                      try {
                        const parsed = JSON.parse(record.analysis)
                        hasAnalysis = !!parsed.parentingSuggestions
                      } catch {
                        hasAnalysis = !!record.analysis
                      }
                    }

                    return (
                      <div
                        key={record.id}
                        className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
                      >
                        {/* 分类标签 */}
                        {categoryInfo && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 mb-2">
                            {categoryInfo.icon} {categoryInfo.label}
                          </span>
                        )}

                        {/* 行为标题 */}
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {record.behavior}
                        </h3>

                        {/* 描述/备注 */}
                        {record.notes && (
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                            {record.notes}
                          </p>
                        )}

                        {/* 图片 */}
                        {record.imageUrl && (
                          <div className="rounded-lg overflow-hidden mb-3 border border-gray-100">
                            <img
                              src={record.imageUrl}
                              alt="记录图片"
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        )}

                        {/* 底部信息 */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatAge(record.ageInMonths)}
                          </span>

                          {hasAnalysis && (
                            <Link
                              href={`/children/${selectedChild.id}/insights/${record.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-accent-400 text-accent-600 text-xs font-medium hover:bg-accent-50 transition-colors"
                            >
                              <span>✨</span> 查看AI解读
                            </Link>
                          )}
                        </div>

                        {/* 里程碑 */}
                        {record.milestones && (
                          <div className="mt-2 inline-block px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-md">
                            🏆 {record.milestones}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// 按日期分组记录
function groupByDate(records: any[]) {
  const groups: Record<string, any[]> = {}
  for (const record of records) {
    const dateKey = new Date(record.date).toISOString().split('T')[0]
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(record)
  }
  return groups
}

// 格式化日期分组标题
function formatDateGroup(dateKey: string): string {
  const date = new Date(dateKey + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  const month = date.getMonth() + 1
  const day = date.getDate()
  const dateStr = `${month}月${day}日`

  if (diffDays === 0) return `${dateStr} · 今天`
  if (diffDays === 1) return `${dateStr} · 昨天`
  if (diffDays < 7) return `${dateStr} · ${diffDays}天前`
  return dateStr
}
