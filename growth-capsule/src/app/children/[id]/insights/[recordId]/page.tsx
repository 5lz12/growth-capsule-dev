import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { BEHAVIOR_CATEGORIES } from '@/types'
import { formatAge } from '@/lib/utils'
import { FavoriteButton } from '@/components/FavoriteButton'
import { ShareButton } from '@/components/ShareButton'
import { FeedbackButtons } from '@/components/FeedbackButtons'

export default async function InsightDetailPage({
  params,
}: {
  params: { id: string; recordId: string }
}) {
  const child = await prisma.child.findUnique({
    where: { id: params.id },
  })

  const record = await prisma.record.findUnique({
    where: { id: params.recordId },
  })

  if (!child || !record || record.childId !== params.id) {
    redirect('/')
  }

  // 解析结构化分析数据
  let structuredAnalysis = null
  if (record.analysis) {
    try {
      const parsed = JSON.parse(record.analysis)
      if (parsed.parentingSuggestions) {
        structuredAnalysis = parsed
      }
    } catch {
      // 历史记录使用纯文本格式
    }
  }

  const categoryInfo = BEHAVIOR_CATEGORIES.find(c => c.value === record.category)
  const recordDate = new Date(record.date)

  // 生成发展阶段标签
  const stageLabel = generateStageLabel(record.ageInMonths, categoryInfo?.label)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/30 to-white">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href={`/children/${params.id}`}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800">成长深度解读</h1>
            <p className="text-xs text-gray-500">Growth Insight</p>
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-2">
            <Link
              href={`/children/${params.id}/records/${params.recordId}/edit`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="编辑记录"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
            <ShareButton
              title={`${child.name}的成长解读`}
              text={`${record.behavior}\n\n${structuredAnalysis?.psychologicalInterpretation || record.analysis || ''}`}
            />
            <FavoriteButton recordId={record.id} initialIsFavorite={record.isFavorite} />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* 发展阶段标签 */}
        <div className="inline-block px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-full text-sm font-medium shadow-sm">
          {stageLabel}
        </div>

        {/* 记录回顾卡 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {record.imageUrl && (
            <div className="relative bg-gray-50">
              <img
                src={record.imageUrl}
                alt={record.behavior}
                className="w-full max-h-96 object-contain"
              />
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              {categoryInfo && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-brand-50 text-brand-700 border border-brand-200">
                  {categoryInfo.icon} {categoryInfo.label}
                </span>
              )}
              <span className="text-sm text-gray-500">
                {recordDate.toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {record.behavior}
            </h2>

            {record.notes && (
              <p className="text-gray-600 text-sm leading-relaxed">
                {record.notes}
              </p>
            )}

            <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
              <span>📍 {child.name}，{formatAge(record.ageInMonths)}</span>
            </div>
          </div>
        </div>

        {/* 分析内容 */}
        {structuredAnalysis ? (
          <div className="space-y-5">
            {/* A. 当前发展阶段 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">🌱</span>
                <span>当前发展阶段</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {structuredAnalysis.developmentStage}
              </p>
            </div>

            {/* B. 心理学视角 */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">🧠</span>
                <span>心理学视角</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {structuredAnalysis.psychologicalInterpretation}
              </p>

              {/* 里程碑标记 */}
              {record.milestones && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-xl">🏆</span>
                  <span className="text-sm font-medium text-amber-800">
                    {record.milestones}
                  </span>
                </div>
              )}
            </div>

            {/* C. 暖心解读 */}
            {structuredAnalysis.emotionalInterpretation && (
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100 p-6">
                <h3 className="text-lg font-semibold text-pink-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">❤️</span>
                  <span>暖心解读</span>
                </h3>

                {/* 引用式排版 */}
                <div className="border-l-4 border-pink-300 pl-4 mb-4">
                  <p className="text-gray-700 leading-relaxed italic">
                    "{structuredAnalysis.emotionalInterpretation}"
                  </p>
                </div>

                <p className="text-sm text-gray-600">
                  作为父母，看到孩子的这一刻，您一定也感受到了成长的喜悦。每一个细微的进步，都是孩子努力探索世界的证明。
                </p>
              </div>
            )}

            {/* D. 陪伴建议 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                <span>陪伴建议</span>
              </h3>

              <div className="space-y-4">
                {structuredAnalysis.parentingSuggestions.map((suggestion: any, idx: number) => {
                  const typeConfigMap = {
                    observe: {
                      icon: '👁️',
                      label: '持续观察',
                      bgColor: 'bg-gray-50',
                      borderColor: 'border-gray-200',
                      textColor: 'text-gray-700',
                    },
                    emotional: {
                      icon: '💙',
                      label: '情绪支持',
                      bgColor: 'bg-blue-50',
                      borderColor: 'border-blue-200',
                      textColor: 'text-blue-900',
                    },
                    guidance: {
                      icon: '🌱',
                      label: '适度引导',
                      bgColor: 'bg-amber-50',
                      borderColor: 'border-amber-200',
                      textColor: 'text-amber-900',
                    },
                    none: {
                      icon: '✅',
                      label: '无需建议',
                      bgColor: 'bg-green-50',
                      borderColor: 'border-green-200',
                      textColor: 'text-green-900',
                    },
                  }
                  const typeConfig = typeConfigMap[suggestion.type as keyof typeof typeConfigMap] || typeConfigMap.observe

                  return (
                    <div
                      key={idx}
                      className={`${typeConfig.bgColor} border ${typeConfig.borderColor} rounded-xl p-4`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{typeConfig.icon}</span>
                        <span className={`text-sm font-semibold ${typeConfig.textColor}`}>
                          {typeConfig.label}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed mb-3">
                        {suggestion.content}
                      </p>

                      {/* 对话示例 */}
                      {suggestion.deepInsight && (
                        <div className="mt-3 border-l-4 border-gray-300 pl-3">
                          <p className="text-sm font-medium text-gray-600 mb-1">
                            💬 你可以这样对孩子说：
                          </p>
                          <p className="text-sm text-gray-700 italic">
                            "{suggestion.deepInsight}"
                          </p>
                        </div>
                      )}

                      {/* 理论参考 */}
                      {suggestion.theoryReference && (
                        <p className="text-xs text-gray-500 mt-2">
                          📚 {suggestion.theoryReference}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 置信度说明 */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-lg">ℹ️</span>
                <div className="flex-1">
                  <p className="text-gray-600 mb-2">
                    <strong>分析置信度：</strong>
                    {structuredAnalysis.confidenceLevel === 'high' && '高 - 明确的发展里程碑'}
                    {structuredAnalysis.confidenceLevel === 'medium' && '中 - 可能的阶段性表现'}
                    {structuredAnalysis.confidenceLevel === 'low' && '低 - 建议持续观察'}
                  </p>
                  <p className="text-xs text-gray-500">
                    来源：{structuredAnalysis.source === 'api' ? '外部AI分析' : '本地心理学规则引擎'}
                  </p>
                </div>
              </div>
            </div>

            {/* 反馈机制 */}
            <FeedbackButtons recordId={record.id} />

            {/* 底部免责声明 */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-800 leading-relaxed">
                ⚠️ <strong>温馨提示：</strong>
                本解读基于发展心理学理论提供参考，不替代专业心理评估或医疗建议。每个孩子的发展节奏不同，请结合实际情况理解。
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-400">暂无分析数据</p>
          </div>
        )}
      </main>
    </div>
  )
}

function generateStageLabel(ageInMonths: number, category?: string): string {
  const years = Math.floor(ageInMonths / 12)
  const months = ageInMonths % 12

  let ageStr = ''
  if (years > 0) {
    ageStr = `${years}岁`
    if (months > 0) {
      ageStr += `${months}个月`
    }
  } else {
    ageStr = `${months}个月`
  }

  // 根据年龄和类别生成有趣的标签
  const labels: Record<string, string[]> = {
    motor: ['小小探险家', '活力宝贝', '运动健将', '灵活小猴'],
    language: ['语言小天才', '表达小能手', '故事大王', '话语精灵'],
    social: ['社交小达人', '友谊使者', '合作小伙伴', '贴心宝贝'],
    cognitive: ['小小思考家', '好奇宝宝', '智慧之星', '问题探究者'],
    emotional: ['情感小管家', '温暖天使', '情绪小主人', '贴心小棉袄'],
  }

  const categoryLabels = category ? labels[category] || labels.cognitive : labels.cognitive
  const randomLabel = categoryLabels[Math.floor(Math.random() * categoryLabels.length)]

  return `${ageStr}：${randomLabel}`
}
