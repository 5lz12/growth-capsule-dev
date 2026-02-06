import Link from 'next/link'
import prisma from '@/lib/prisma'
import { BEHAVIOR_CATEGORIES } from '@/types'
import { formatAge } from '@/lib/utils'
import { InsightRadarChart } from './components/InsightRadarChart'

type TimeRange = '1m' | '3m' | '6m' | 'all'

export default async function InsightsPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { range?: TimeRange }
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

  // 根据时间范围筛选记录
  const range = searchParams.range || 'all'
  const filteredRecords = filterRecordsByRange(child.records, range)

  // 计算各类别数量
  const categoryData = BEHAVIOR_CATEGORIES.map(cat => {
    const count = filteredRecords.filter(r => r.category === cat.value).length
    return {
      category: cat.label,
      value: count,
      fullMark: Math.max(...BEHAVIOR_CATEGORIES.map(c =>
        filteredRecords.filter(r => r.category === c.value).length
      ), 1), // 归一化
    }
  })

  // 生成阶段性总结
  const summary = generateSummary(child, filteredRecords, range)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href={`/children/${params.id}`}
            className="text-blue-600 hover:text-blue-700"
          >
            ← 返回
          </Link>
          <h1 className="text-xl font-bold text-gray-800">成长洞察</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 孩子信息 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{child.name}</h2>
          <p className="text-gray-600">
            {formatAge(ageInMonths)} · {child.records.length} 条记录
          </p>
        </div>

        {/* 时间范围选择器 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">选择时间范围</h3>
          <div className="flex gap-3 flex-wrap">
            {[
              { value: '1m', label: '近1个月' },
              { value: '3m', label: '近3个月' },
              { value: '6m', label: '近6个月' },
              { value: 'all', label: '全部' },
            ].map(option => (
              <Link
                key={option.value}
                href={`/children/${params.id}/insights?range=${option.value}`}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  range === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        {/* 成长维度雷达图 */}
        {filteredRecords.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">成长维度分布</h3>
            <div className="h-64 md:h-96">
              <InsightRadarChart data={categoryData} />
            </div>

            {/* 维度说明 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
              {BEHAVIOR_CATEGORIES.map(cat => {
                const count = filteredRecords.filter(r => r.category === cat.value).length
                return (
                  <div key={cat.value} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <p className="text-xs text-gray-600 truncate">{cat.label}</p>
                    <p className="text-lg font-bold text-blue-600">{count}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-400">该时间段内没有记录</p>
          </div>
        )}

        {/* 阶段性总结 */}
        {filteredRecords.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">阶段性成长总结</h3>

            <div className="space-y-4">
              {/* 免责声明 */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  ⚠️ <strong>温馨提示：</strong>
                  以下总结基于发展心理学理论提供参考，不替代专业心理评估或医疗建议。每个孩子的发展节奏不同，请结合实际情况理解。
                </p>
              </div>

              {/* 发展概述 */}
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 overflow-hidden">
                <p className="text-sm font-medium text-purple-900 mb-2">📊 发展概述</p>
                <p className="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">{summary.overview}</p>
              </div>

              {/* 各维度分析 */}
              {summary.dimensions.map((dim, idx) => (
                <div key={idx} className="bg-blue-50 border-l-4 border-blue-500 p-4 overflow-hidden">
                  <p className="text-sm font-medium text-blue-900 mb-2 break-words">
                    {dim.icon} {dim.category}
                  </p>
                  <p className="text-sm text-gray-700 mb-2 leading-relaxed break-words">{dim.analysis}</p>
                  {dim.theory && (
                    <p className="text-xs text-gray-500 italic break-words">📚 {dim.theory}</p>
                  )}
                </div>
              ))}

              {/* 总体建议 */}
              <div className="bg-pink-50 border-l-4 border-pink-400 p-4 overflow-hidden">
                <p className="text-sm font-medium text-pink-900 mb-2">💗 养育建议</p>
                <p className="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">{summary.advice}</p>
              </div>
            </div>
          </div>
        )}

        {/* 理论基础说明 */}
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">📚 理论基础</h3>
          <p className="text-xs text-blue-700 leading-relaxed">
            本洞察分析基于经典发展心理学理论，包括：
          </p>
          <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
            <li>皮亚杰认知发展理论</li>
            <li>埃里克森心理社会发展理论</li>
            <li>维果茨基社会文化理论</li>
            <li>鲍尔比依恋理论</li>
            <li>格塞尔发展量表</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

// 根据时间范围筛选记录
function filterRecordsByRange(records: any[], range: TimeRange) {
  if (range === 'all') return records

  const now = Date.now()
  const ranges = {
    '1m': 30 * 24 * 60 * 60 * 1000,
    '3m': 90 * 24 * 60 * 60 * 1000,
    '6m': 180 * 24 * 60 * 60 * 1000,
  }

  const cutoff = now - ranges[range]
  return records.filter(r => new Date(r.date).getTime() >= cutoff)
}

// 生成阶段性总结
function generateSummary(child: any, records: any[], range: TimeRange) {
  const rangeText = {
    '1m': '近1个月',
    '3m': '近3个月',
    '6m': '近6个月',
    'all': '全部',
  }[range]

  // 计算各类别数量
  const categoryCounts = BEHAVIOR_CATEGORIES.map(cat => ({
    ...cat,
    count: records.filter(r => r.category === cat.value).length,
  }))

  // 找出最多和最少的维度
  const maxCategory = categoryCounts.reduce((a, b) => (a.count > b.count ? a : b))
  const minCategory = categoryCounts.reduce((a, b) => (a.count < b.count ? a : b))

  // 发展概述
  const overview = `在${rangeText}内，${child.name}共有 ${records.length} 条成长记录。
    记录主要集中在${maxCategory.count > 0 ? maxCategory.label : '早期探索阶段'}，
    ${maxCategory.count > 0 ? `其中${maxCategory.label}领域的记录最多（${maxCategory.count}条），` : ''}
    这表明该领域是当前发展的重点。${minCategory.count === 0 ? `其他领域的观察记录相对较少，建议在未来增加更多维度的关注。` : ''}`

  // 各维度分析
  const dimensions = categoryCounts
    .filter(cat => cat.count > 0)
    .map(cat => {
      const theoryMap: Record<string, string> = {
        motor: '基于格塞尔发展量表和动作发展理论',
        language: '参考维果茨基语言发展理论和皮亚杰认知发展理论',
        social: '基于埃里克森心理社会发展理论和鲍尔比依恋理论',
        cognitive: '基于皮亚杰认知发展理论',
        emotional: '基于情绪智力理论和发展心理学情感发展研究',
      }

      const analysisMap: Record<string, string> = {
        motor: `运动能力的发展是儿童早期成长的重要指标。${cat.count}条记录显示了该领域的发展轨迹，从大运动到精细动作的逐步成熟。`,
        language: `语言发展是认知和社会性发展的基础。${cat.count}条记录反映了语言能力的进步，包括词汇量、表达能力和理解力的提升。`,
        social: `社交能力的发展体现了儿童从自我中心向社会化的转变。${cat.count}条记录展示了与他人互动、建立关系的过程。`,
        cognitive: `认知发展体现了儿童对世界的理解和思考能力。${cat.count}条记录反映了好奇心、问题解决能力和思维模式的发展。`,
        emotional: `情感能力的发展是心理健康的基础。${cat.count}条记录记录了情绪识别、表达和调节能力的成长过程。`,
      }

      return {
        icon: cat.icon,
        category: cat.label,
        analysis: analysisMap[cat.value] || `该维度有${cat.count}条记录，展现了持续的发展轨迹。`,
        theory: theoryMap[cat.value],
      }
    })

  // 总体建议
  const advice = `基于${records.length}条记录的分析，${child.name}在多个领域都表现出积极的发展态势。
    建议在保持当前优势领域的同时，适当关注相对薄弱的领域，提供多样化的探索机会。
    每个孩子的发展节奏不同，最重要的是提供安全、支持性的环境，让孩子按照自己的节奏成长。
    持续记录和观察，能帮助您更好地理解孩子独特的成长轨迹。`

  return {
    overview,
    dimensions,
    advice,
  }
}
