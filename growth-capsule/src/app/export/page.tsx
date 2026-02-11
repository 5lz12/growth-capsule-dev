import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getServerUid } from '@/lib/auth'
import { ExportPreview } from './components/ExportPreview'

export default async function ExportPage({
  searchParams,
}: {
  searchParams: { childId?: string }
}) {
  const ownerUid = getServerUid()

  const children = await prisma.child.findMany({
    where: { ownerUid },
    include: {
      records: {
        orderBy: { date: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (children.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">还没有记录，先去添加一个孩子吧</p>
          <Link
            href="/children/new"
            className="inline-block px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            添加孩子
          </Link>
        </div>
      </div>
    )
  }

  const selectedChildId = searchParams.childId || children[0].id
  const selectedChild = children.find(c => c.id === selectedChildId) || children[0]

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/profile"
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">成长回忆册</h1>
            <p className="text-xs text-gray-500">Growth Memory Book</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 孩子选择器 */}
        {children.length > 1 && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">选择孩子</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {children.map((child) => (
                <Link
                  key={child.id}
                  href={`/export?childId=${child.id}`}
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
          </div>
        )}

        {/* 导出预览和设置 */}
        <ExportPreview child={selectedChild} records={selectedChild.records} />
      </main>
    </div>
  )
}
