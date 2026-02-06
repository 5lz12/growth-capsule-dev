import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatAge } from '@/lib/utils'

export default async function ProfilePage() {
  const children = await prisma.child.findMany({
    include: {
      records: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🏠 我的家庭
            </h1>
            <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm">
              ← 返回首页
            </Link>
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
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                    className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* 头像 */}
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0 border-2 border-white shadow">
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
                          <div className="bg-blue-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-blue-600">{child.records.length}</p>
                            <p className="text-xs text-gray-600">成长瞬间</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-purple-600">{explorationThemes}</p>
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
              className="block bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-6 hover:border-blue-400 hover:bg-blue-50 transition-all text-center"
            >
              <div className="text-3xl mb-2">➕</div>
              <p className="text-gray-600">添加孩子</p>
            </Link>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100 p-6">
              <h3 className="text-lg font-bold text-purple-900 mb-4">📊 成长概览</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{children.length}</p>
                  <p className="text-xs text-purple-700">孩子</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{totalRecords}</p>
                  <p className="text-xs text-purple-700">成长瞬间</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{totalExplorationThemes}</p>
                  <p className="text-xs text-purple-700">探索领域</p>
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
                  href="/children/new"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">👶</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">基本档案管理</p>
                    <p className="text-xs text-gray-500">添加、编辑孩子信息</p>
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

                <div className="flex items-center gap-3 p-3 rounded-lg opacity-60">
                  <span className="text-2xl">📸</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">成长回忆册导出</p>
                    <p className="text-xs text-gray-500">生成 PDF 或长图</p>
                  </div>
                  <span className="text-xs text-gray-500">即将上线</span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg opacity-60">
                  <span className="text-2xl">📚</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">成长阶段指南</p>
                    <p className="text-xs text-gray-500">了解各年龄段的典型发展</p>
                  </div>
                  <span className="text-xs text-gray-500">即将上线</span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg opacity-60">
                  <span className="text-2xl">❓</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">帮助与支持</p>
                    <p className="text-xs text-gray-500">使用指南和常见问题</p>
                  </div>
                  <span className="text-xs text-gray-500">即将上线</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
              <h3 className="text-sm font-bold text-blue-900 mb-2">💡 关于成长时间胶囊</h3>
              <p className="text-xs text-blue-700 leading-relaxed">
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
