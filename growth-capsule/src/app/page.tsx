import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatAge } from '@/lib/utils'

export default async function HomePage() {
  // 获取所有孩子
  const children = await prisma.child.findMany({
    include: {
      records: {
        orderBy: { date: 'desc' },
        take: 5,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // 计算总记录数
  const totalRecords = children.reduce((sum, child) => sum + child.records.length, 0)

  // 获取最近一条记录（用于AI发现）
  const latestRecord = children
    .flatMap(child => child.records.map(r => ({ ...r, childName: child.name, childId: child.id })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

  // 获取最近带图片的记录（用于"最近瞬间"画廊）
  const recentPhotos = children
    .flatMap(child => child.records.map(r => ({ ...r, childName: child.name, childId: child.id })))
    .filter(r => r.imageUrl)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent">
            🌱 成长时间胶囊
          </h1>
          <div className="flex items-center gap-3">
            {children.length > 0 && (
              <>
                <Link
                  href="/children/new"
                  className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm"
                >
                  + 添加孩子
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {children.length === 0 ? (
          // 首次使用状态
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
          <div className="space-y-8">
            {/* 1. 问候与提示区 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {getGreeting()}
              </h2>
              <p className="text-gray-600 mb-1">
                记下这一刻，理解可以慢慢来
              </p>
              <p className="text-sm text-gray-500">
                每个孩子的成长都值得被看见
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="text-lg">📝</span>
                  <span>{totalRecords} 条记录</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg">👶</span>
                  <span>{children.length} 个孩子</span>
                </div>
              </div>
            </div>

            {/* 2. 最近瞬间（横向图片画廊） */}
            {recentPhotos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  最近瞬间
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {recentPhotos.map((photo) => (
                    <Link
                      key={photo.id}
                      href={`/children/${photo.childId}#record-${photo.id}`}
                      className="flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-100 hover:border-brand-300 transition-all shadow-sm hover:shadow-md"
                    >
                      <img
                        src={photo.imageUrl!}
                        alt={photo.behavior}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 3. 最新成长发现（AI深度洞察） */}
            {latestRecord && (
              <div className="bg-gradient-to-br from-accent-50 to-brand-50 rounded-2xl border border-accent-100 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">✨</span>
                  <span className="text-sm font-semibold text-accent-600">AI 深度洞察</span>
                </div>
                <p className="text-gray-700 mb-4">
                  在 {latestRecord.childName} {formatAge(latestRecord.ageInMonths)}时，
                  <span className="font-semibold">"{latestRecord.behavior.substring(0, 30)}..."</span>
                  是一个值得记录的成长时刻。
                </p>
                <Link
                  href={`/children/${latestRecord.childId}`}
                  className="inline-flex items-center gap-1 text-sm text-accent-600 hover:text-accent-500 font-medium"
                >
                  查看完整解读 →
                </Link>
              </div>
            )}

            {/* 4. 快捷记录入口 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                快速记录
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href={`/children/${children[0].id}/record`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-brand-200 transition-all group"
                >
                  <div className="text-3xl mb-3">✏️</div>
                  <p className="font-semibold text-gray-800 group-hover:text-brand-600 transition-colors">
                    文字记录
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    记录孩子的行为和语言
                  </p>
                </Link>

                <Link
                  href={`/children/${children[0].id}/record`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-brand-200 transition-all group"
                >
                  <div className="text-3xl mb-3">📸</div>
                  <p className="font-semibold text-gray-800 group-hover:text-brand-600 transition-colors">
                    图文记录
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    拍照并记录成长瞬间
                  </p>
                </Link>

                <Link
                  href={`/children/${children[0].id}/voice-record`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-brand-200 transition-all group"
                >
                  <div className="text-3xl mb-3">🎤</div>
                  <p className="font-semibold text-gray-800 group-hover:text-brand-600 transition-colors">
                    语音记录
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    语音转文字，自动记录
                  </p>
                </Link>

                <Link
                  href={`/children/${children[0].id}/photo-record`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-brand-200 transition-all group"
                >
                  <div className="text-3xl mb-3">💭</div>
                  <p className="font-semibold text-gray-800 group-hover:text-brand-600 transition-colors">
                    情绪记录
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    记录孩子的情绪表现
                  </p>
                </Link>
              </div>
            </div>

            {/* 5. 我的孩子 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                我的孩子
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children.map((child) => {
                  const ageInMonths = Math.floor(
                    (Date.now() - new Date(child.birthDate).getTime()) /
                      (1000 * 60 * 60 * 24 * 30.44)
                  )

                  return (
                    <Link
                      key={child.id}
                      href={`/children/${child.id}`}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-brand-200 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">
                            {child.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {formatAge(ageInMonths)} · {child.gender === 'male' ? '男孩' : '女孩'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-brand-600">
                            {child.records.length}
                          </p>
                          <p className="text-xs text-gray-500">条记录</p>
                        </div>
                      </div>

                      {child.records.length > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">最近记录</p>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {(() => {
                                const icons: Record<string, string> = {
                                  motor: '🏃',
                                  language: '🗣️',
                                  social: '👥',
                                  cognitive: '🧠',
                                  emotional: '❤️',
                                }
                                return icons[child.records[0].category] || '📝'
                              })()}
                            </span>
                            <p className="text-sm text-gray-700 truncate flex-1">
                              {child.records[0].behavior}
                            </p>
                          </div>
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// 根据时间返回问候语
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了，注意休息 🌙'
  if (hour < 12) return '早上好 ☀️'
  if (hour < 14) return '中午好 🌤️'
  if (hour < 18) return '下午好 ☕'
  return '晚上好 🌙'
}
