import Link from 'next/link'
import prisma from '@/lib/prisma'
import { BEHAVIOR_CATEGORIES, SUGGESTION_TYPE_CONFIG, CONFIDENCE_CONFIG } from '@/types'
import { ParentingSuggestion, ConfidenceLevel } from '@/lib/analyzers/base'
import { CategoryFilter } from '@/components/CategoryFilter'
import { RecordDeleteButton } from '@/components/RecordDeleteButton'
import { formatAge } from '@/lib/utils'

export default async function ChildDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { category?: string }
}) {
  const child = await prisma.child.findUnique({
    where: { id: params.id },
    include: {
      records: {
        orderBy: { date: 'desc' },
      },
    },
  })

  if (!child) {
    return <div>孩子不存在</div>
  }

  const ageInMonths = Math.floor(
    (Date.now() - new Date(child.birthDate).getTime()) /
      (1000 * 60 * 60 * 24 * 30.44)
  )

  // 计算陪伴天数
  const companionshipDays = Math.floor(
    (Date.now() - new Date(child.birthDate).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  const categoryStats = child.records.reduce((acc, record) => {
    acc[record.category] = (acc[record.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 根据 URL 参数筛选记录
  const categoryFilter = searchParams.category || null
  const filteredRecords = categoryFilter
    ? child.records.filter(r => r.category === categoryFilter)
    : child.records

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-brand-600 hover:text-brand-700">
              ← 返回
            </Link>
            <Link href="/profile" className="text-gray-400 hover:text-accent-600 transition-colors text-lg" title="我的家庭">
              🏠
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800">{child.name}</h1>
            <Link
              href={`/children/${params.id}/edit`}
              className="text-gray-400 hover:text-brand-600 transition-colors p-2"
              title="编辑资料"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 孩子信息卡片 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* 头像和基本信息 */}
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center flex-shrink-0 border-4 border-white shadow-lg">
              {child.avatarUrl ? (
                <img
                  src={child.avatarUrl}
                  alt={child.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl">{child.gender === 'male' ? '👦' : '👧'}</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{child.name}</h2>
              <p className="text-gray-600">
                {child.gender === 'male' ? '男孩' : '女孩'} · {formatAge(ageInMonths)}
              </p>
            </div>
            <Link
              href={`/children/${params.id}/edit`}
              className="text-gray-400 hover:text-brand-600 transition-colors"
              title="编辑资料"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002 2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">年龄</p>
              <p className="text-lg font-semibold text-gray-800">{formatAge(ageInMonths)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">性别</p>
              <p className="text-lg font-semibold text-gray-800">
                {child.gender === 'male' ? '男孩' : '女孩'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">记录数</p>
              <p className="text-lg font-semibold text-gray-800">{child.records.length} 条</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">陪伴天数</p>
              <p className="text-lg font-semibold text-blue-600">{companionshipDays} 天</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              出生日期：{new Date(child.birthDate).toLocaleDateString('zh-CN')}
            </p>
          </div>
        </div>

        {/* 类别统计 + 洞察入口 */}
        {Object.keys(categoryStats).length > 0 && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">发展领域分布</h2>
                <Link
                  href={`/children/${child.id}/insights`}
                  className="px-4 py-2 bg-gradient-to-r from-accent-500 to-brand-500 text-white rounded-lg hover:from-accent-600 hover:to-brand-600 transition-all text-sm font-medium"
                >
                  📊 查看洞察
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {BEHAVIOR_CATEGORIES.map((cat) => {
                  const count = categoryStats[cat.value] || 0
                  return (
                    <div
                      key={cat.value}
                      className="text-center p-3 bg-gray-50 rounded-lg hover:bg-brand-50 transition-colors cursor-pointer"
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <p className="text-xs text-gray-600">{cat.label}</p>
                      <p className="text-lg font-bold text-blue-600">{count}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* AI 洞察卡片 */}
            <Link
              href={`/children/${child.id}/insights`}
              className="block bg-gradient-to-br from-accent-50 to-brand-50 rounded-xl border border-accent-100 p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">✨</span>
                <div>
                  <h3 className="text-lg font-bold text-purple-900">AI 成长洞察</h3>
                  <p className="text-sm text-purple-700">查看多维度分析和阶段性总结</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-600">
                <span>雷达图分析</span>
                <span>·</span>
                <span>趋势解读</span>
                <span>·</span>
                <span>养育建议</span>
              </div>
            </Link>
          </>
        )}

        {/* 记录列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">成长记录</h2>
            <div className="flex gap-2">
              <Link
                href={`/children/${child.id}/photo-record`}
                className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors text-sm"
              >
                📷 拍照
              </Link>
              <Link
                href={`/children/${child.id}/record`}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm"
              >
                ✏️ 文字
              </Link>
            </div>
          </div>

          {child.records.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              还没有记录，点击上方按钮开始记录
            </div>
          ) : (
            <>
              <CategoryFilter records={child.records} />
              <div className="space-y-6">
                {filteredRecords.map((record) => {
                const categoryInfo = BEHAVIOR_CATEGORIES.find(
                  (c) => c.value === record.category
                )

                // 尝试解析结构化分析数据
                let structuredAnalysis = null
                let confidenceLevel: ConfidenceLevel = 'medium'
                let parentingSuggestions: ParentingSuggestion[] = []

                if (record.analysis) {
                  try {
                    const parsed = JSON.parse(record.analysis)
                    if (parsed.parentingSuggestions) {
                      structuredAnalysis = parsed
                      confidenceLevel = parsed.confidenceLevel || 'medium'
                      parentingSuggestions = parsed.parentingSuggestions || []
                    }
                  } catch {
                    // 历史记录使用纯文本格式
                  }
                }

                return (
                  <div
                    key={record.id}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* 图片显示 */}
                    {record.imageUrl && (
                      <div className="border-b border-gray-100">
                        <img
                          src={record.imageUrl}
                          alt="记录图片"
                          className="w-full h-auto"
                        />
                      </div>
                    )}

                    <div className="p-5 space-y-4">
                      {/* 顶部：行为描述 + 编辑按钮 */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-2xl mt-0.5">{categoryInfo?.icon || '📝'}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 leading-snug">
                              {record.behavior}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(record.date).toLocaleDateString('zh-CN')} · {formatAge(record.ageInMonths)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/children/${params.id}/records/${record.id}/edit`}
                            className="text-gray-300 hover:text-brand-500 transition-colors p-1.5 rounded-lg hover:bg-gray-50"
                            title="编辑记录"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <RecordDeleteButton recordId={record.id} />
                        </div>
                      </div>

                      {/* 里程碑标签 */}
                      {record.milestones && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 text-sm rounded-full font-medium">
                          <span>🏆</span> {record.milestones}
                        </div>
                      )}

                      {/* 纯文本分析（历史记录向后兼容） */}
                      {record.analysis && !structuredAnalysis && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {record.analysis}
                          </p>
                        </div>
                      )}

                      {/* 结构化分析 - 重设计版 */}
                      {structuredAnalysis && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">

                          {/* 发展阶段 badge */}
                          {structuredAnalysis.developmentStage && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-xs font-medium rounded-full shadow-sm">
                              <span>🧒</span> {structuredAnalysis.developmentStage}
                            </div>
                          )}

                          {/* 心理学视角 - 紫色渐变卡片 */}
                          {structuredAnalysis.psychologicalInterpretation && (
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4">
                              <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                                <span>🧠</span> 心理学视角
                              </p>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {structuredAnalysis.psychologicalInterpretation}
                              </p>
                            </div>
                          )}

                          {/* 情感共鸣 - 粉色渐变卡片 */}
                          {structuredAnalysis.emotionalInterpretation && (
                            <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 rounded-xl p-4">
                              <p className="text-xs font-semibold text-pink-700 mb-2 flex items-center gap-1">
                                <span>💗</span> 情感共鸣
                              </p>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {structuredAnalysis.emotionalInterpretation}
                              </p>
                            </div>
                          )}

                          {/* 养育建议 */}
                          {parentingSuggestions.length > 0 && (
                            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                              <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                <span>💡</span> 养育建议
                              </p>

                              {parentingSuggestions.map((suggestion, idx) => {
                                const typeIcons: Record<string, string> = {
                                  observe: '👁️',
                                  emotional: '💙',
                                  guidance: '🌱',
                                  none: '✅',
                                }
                                const typeColors: Record<string, string> = {
                                  observe: 'text-gray-600',
                                  emotional: 'text-blue-600',
                                  guidance: 'text-amber-600',
                                  none: 'text-green-600',
                                }
                                const config = SUGGESTION_TYPE_CONFIG[suggestion.type]
                                return (
                                  <div key={idx} className={idx > 0 ? 'pt-3 border-t border-gray-100' : ''}>
                                    <div className="flex items-start gap-2">
                                      <span className="text-sm mt-0.5">{typeIcons[suggestion.type] || '📌'}</span>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-medium ${typeColors[suggestion.type] || 'text-gray-600'}`}>
                                          {config.label}
                                        </p>
                                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                                          {suggestion.content}
                                        </p>
                                        {/* 理论 + 洞察 折叠在建议内 */}
                                        {(suggestion.theoryReference || suggestion.deepInsight) && (
                                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                                            {suggestion.theoryReference && (
                                              <span>📚 {suggestion.theoryReference}</span>
                                            )}
                                            {suggestion.deepInsight && (
                                              <span>💡 {suggestion.deepInsight}</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}

                              {/* 低置信度提示 */}
                              {confidenceLevel === 'low' && (
                                <div className="pt-3 border-t border-gray-100">
                                  <p className="text-xs text-amber-600">
                                    💡 当前记录信息较少，补充更多细节可获得更准确的分析。
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 底部标签：来源 + 置信度 + 温馨提示 */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                                {structuredAnalysis.source === 'api' ? '🤖 AI分析' : '📋 本地分析'}
                              </span>
                              {confidenceLevel && (
                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                                  confidenceLevel === 'high' ? 'text-green-600 bg-green-50 border-green-100' :
                                  confidenceLevel === 'medium' ? 'text-yellow-600 bg-yellow-50 border-yellow-100' :
                                  'text-gray-500 bg-gray-50 border-gray-100'
                                }`}>
                                  {CONFIDENCE_CONFIG[confidenceLevel]?.label}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-300">⚠️ 仅供参考</span>
                          </div>
                        </div>
                      )}

                      {/* 附加说明 */}
                      {record.notes && (
                        <p className="text-sm text-gray-500 italic bg-gray-50 px-3 py-2 rounded-lg">
                          备注：{record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
              </div>
            </>
          )}
        </div>

        {/* 养育建议说明 */}
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">💡 如何理解养育建议</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-800 mb-4">
            <div className="flex items-start gap-2">
              <span>👁️</span>
              <div>
                <p className="font-medium">持续观察</p>
                <p className="opacity-80">行为正常，无需特殊干预，保持观察即可</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span>💙</span>
              <div>
                <p className="font-medium">情绪支持</p>
                <p className="opacity-80">提供接纳和共情，让孩子感受到情感支持</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span>🌱</span>
              <div>
                <p className="font-medium">适度引导</p>
                <p className="opacity-80">可以尝试适当引导，但不强迫</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span>✅</span>
              <div>
                <p className="font-medium">无需建议</p>
                <p className="opacity-80">一切正常，继续当前的养育方式</p>
              </div>
            </div>
          </div>
          <div className="border-t border-blue-200 pt-3 mt-3">
            <p className="text-xs text-blue-700 font-medium mb-2">📚 理论基础说明</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              本应用的分析基于经典发展心理学理论，包括皮亚杰认知发展理论、维果茨基社会文化理论、埃里克森心理社会发展理论、鲍尔比依恋理论等。
              每条建议都附有理论出处和深度洞察，帮助您不仅知道"怎么做"，更理解"为什么"。
            </p>
          </div>
          <p className="text-xs text-blue-700 mt-3 italic">
            我们的设计原则是：大部分情况下，孩子的发展都不需要特殊干预。保持观察和提供支持性环境即可。
          </p>
        </div>
      </main>
    </div>
  )
}
