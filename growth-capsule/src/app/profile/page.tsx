import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatAge } from '@/lib/utils'
import { getServerUid } from '@/lib/auth'

export default async function ProfilePage() {
  const ownerUid = getServerUid()

  const children = await prisma.child.findMany({
    where: { ownerUid },
    include: {
      records: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // 获取当前用户的收藏记录
  const favoriteRecords = await prisma.record.findMany({
    where: {
      ownerUid,
      isFavorite: true,
    },
    include: {
      child: true,
    },
    orderBy: { date: 'desc' },
    take: 10,
  })

  const totalRecords = children.reduce((sum, child) => sum + child.records.length, 0)
  const totalExplorationThemes = new Set(
    children.flatMap(child => child.records.map(r => r.category))
  ).size

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const hasTodayAnalysis = children.some(child =>
    child.records.some(r => {
      const recordDate = new Date(r.createdAt)
      recordDate.setHours(0, 0, 0, 0)
      return recordDate.getTime() === today.getTime()
    })
  )

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">
              家庭档案
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {children.length === 0 ? '欢迎开始记录' : '继续陪伴成长'}
          </h2>
          <p className="text-gray-600">
            {children.length === 0
              ? '添加第一个孩子，开始记录珍贵的成长瞬间'
              : '每个孩子的成长都值得被看见和记录'}
          </p>
        </div>

        {children.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👶</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              开始记录成长时光
            </h2>
            <p className="text-gray-500 mb-6">
              添加第一个孩子，开始记录珍贵的成长瞬间
            </p>
            <Link
              href="/children/new"
              className="inline-block px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              添加孩子
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {children.map((child) => {
                const ageInMonths = Math.floor(
                  (Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
                )

                const companionshipDays = Math.floor(
                  (Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24)
                )

                const categoryStats = child.records.reduce((acc, record) => {
                  acc[record.category] = (acc[record.category] || 0) + 1
                  return acc
                }, {} as Record<string, number>)

                const explorationThemes = Object.keys(categoryStats).length

                return (
                  <Link
                    key={child.id}
                    href={`/children/${child.id}`}
                    className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-brand-200 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* 头像 */}
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center flex-shrink-0 border-2 border-white shadow">
                        {child.avatarUrl ? (
                          <img
                            src={child.avatarUrl}
                            alt={child.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl">{child.gender === 'male' ? '👦' : '👧'}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-800">{child.name}</h3>
                          <p className="text-sm text-gray-500">{formatAge(ageInMonths)}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center mb-3">
                          <div className="bg-brand-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-brand-600">{child.records.length}</p>
                            <p className="text-xs text-gray-600">成长瞬间</p>
                          </div>
                          <div className="bg-accent-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-accent-600">{explorationThemes}</p>
                            <p className="text-xs text-gray-600">探索主题</p>
                          </div>
                          <div className="bg-pink-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-pink-600">{companionshipDays}</p>
                            <p className="text-xs text-gray-600">陪伴天数</p>
                          </div>
                        </div>

                        {child.records.length > 0 && (
                          <div className="pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">最近记录</p>
                            <p className="text-sm text-gray-700 truncate">{child.records[0].behavior}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <Link
              href="/children/new"
              className="block bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-6 hover:border-brand-400 hover:bg-brand-50 transition-all text-center"
            >
              <div className="text-3xl mb-2">➕</div>
              <p className="text-gray-600">添加孩子</p>
            </Link>

            {/* 珍藏的瞬间 */}
            {favoriteRecords.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <span>珍藏的瞬间</span>
                  </h3>
                  <span className="text-sm text-gray-500">{favoriteRecords.length} 条</span>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {favoriteRecords.map((record) => (
                    <Link
                      key={record.id}
                      href={`/children/${record.childId}/insights/${record.id}`}
                      className="flex-shrink-0 w-40 group"
                    >
                      {record.imageUrl ? (
                        <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-brand-200 mb-2 group-hover:border-brand-400 transition-all shadow-sm group-hover:shadow-md">
                          <img
                            src={record.imageUrl}
                            alt={record.behavior}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 p-1 bg-brand-500/90 rounded-full">
                            <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="w-40 h-40 rounded-xl border-2 border-brand-200 mb-2 flex items-center justify-center bg-gradient-to-br from-brand-50 to-accent-50 group-hover:border-brand-400 transition-all">
                          <span className="text-4xl">📝</span>
                        </div>
                      )}
                      <p className="text-sm text-gray-700 line-clamp-2 leading-snug">
                        {record.behavior}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {record.child.name} · {new Date(record.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-accent-50 to-brand-50 rounded-xl border border-accent-100 p-6">
              <h3 className="text-lg font-bold text-accent-600 mb-4">📊 成长概览</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-accent-600">{children.length}</p>
                  <p className="text-xs text-accent-600">孩子</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent-600">{totalRecords}</p>
                  <p className="text-xs text-accent-600">成长瞬间</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent-600">{totalExplorationThemes}</p>
                  <p className="text-xs text-accent-600">探索领域</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📝 今日解读</h3>
              {hasTodayAnalysis ? (
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-2xl">✅</span>
                  <span>今天已生成 AI 解读</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="text-2xl">📭</span>
                  <span>今天还没有新的记录</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🛠️ 功能</h3>
              <div className="space-y-3">
                <Link
                  href={`/children/${children[0].id}/edit`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">👶</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">基本档案管理</p>
                    <p className="text-xs text-gray-500">编辑孩子信息</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>

                <Link
                  href="/import"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">📥</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">导入日记</p>
                    <p className="text-xs text-gray-500">从 Day One 等应用导入历史记录</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>

                <Link
                  href="/export"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">📸</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">成长回忆册导出</p>
                    <p className="text-xs text-gray-500">生成 PDF 或长图</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>

                <Link
                  href="/guide"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">📚</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">成长阶段指南</p>
                    <p className="text-xs text-gray-500">了解各年龄段的典型发展</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>

                <Link
                  href="/help"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">❓</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">帮助与支持</p>
                    <p className="text-xs text-gray-500">使用指南和常见问题</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>
              </div>
            </div>

            <div className="bg-brand-50 rounded-xl border border-brand-100 p-6">
              <h3 className="text-sm font-bold text-brand-700 mb-2">💡 关于成长时间胶囊</h3>
              <p className="text-xs text-brand-700 leading-relaxed">
                成长时间胶囊是一个基于发展心理学的成长记录工具，
                帮助父母低负担记录孩子的成长瞬间，并通过 AI 将零散记录转化为结构化、可理解、可回顾的成长洞察。
                我们的使命是让每个孩子的成长都被看见和理解。
              </p>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600">版本：v1.0 · 数据仅存储在本地</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
