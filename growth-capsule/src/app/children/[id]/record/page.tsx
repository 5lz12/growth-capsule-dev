import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { BEHAVIOR_CATEGORIES } from '@/types'
import { analyzerManager } from '@/lib/analyzers/analyzer-manager'

export default async function RecordPage({ params }: { params: { id: string } }) {
  const child = await prisma.child.findUnique({
    where: { id: params.id },
  })

  if (!child) {
    redirect('/')
  }

  async function createRecord(formData: FormData) {
    'use server'

    const category = formData.get('category') as string
    const behavior = formData.get('behavior') as string
    const date = formData.get('date') as string
    const notes = formData.get('notes') as string

    if (!category || !behavior || !date) {
      return // 表单验证由 HTML required 属性处理
    }

    // 重新获取 child 信息（server action 中需要）
    const currentChild = await prisma.child.findUnique({
      where: { id: params.id },
    })

    if (!currentChild) {
      redirect('/')
    }

    // 计算月龄
    const recordDate = new Date(date)
    const birthDate = new Date(currentChild.birthDate)
    const ageInMonths = Math.floor(
      (recordDate.getTime() - birthDate.getTime()) /
        (1000 * 60 * 60 * 24 * 30.44)
    )

    // 使用升级后的分析器（包含克制性判断逻辑）
    const analysisResult = await analyzerManager.analyze({
      childAge: ageInMonths,
      behavior,
      context: notes,
      category,
    })

    // 保存结构化JSON格式（用于新的UI展示）
    const structuredAnalysis = JSON.stringify(analysisResult)

    await prisma.record.create({
      data: {
        childId: currentChild.id,
        category,
        behavior,
        date: recordDate,
        ageInMonths,
        notes,
        analysis: structuredAnalysis,
        milestones: analysisResult.milestone,
      },
    })

    redirect(`/children/${currentChild.id}`)
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">
            记录 {child.name} 的成长瞬间
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 提示卡片 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            💡 <strong>温馨提示：</strong>
            记录越详细，分析越准确。建议描述行为的情境、持续时间、孩子反应等细节。
          </p>
        </div>

        <form action={createRecord} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              行为类别 *
            </label>
            <select
              id="category"
              name="category"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">请选择类别</option>
              {BEHAVIOR_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="behavior" className="block text-sm font-medium text-gray-700 mb-2">
              具体行为 *
            </label>
            <textarea
              id="behavior"
              name="behavior"
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder="例如：今天第一次独立站起来，扶着沙发走了几步"
            />
            <p className="mt-1 text-xs text-gray-500">
              描述孩子表现出的具体行为（越详细越好）
            </p>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              发生日期 *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              发生情境（可选）
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder="例如：是在客厅玩的时候发生的，当时很开心，持续了约10分钟"
            />
            <p className="mt-1 text-xs text-gray-500">
              补充情境信息有助于获得更准确的分析
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-2">🎗️ 我们的设计原则</p>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>• 大部分情况下，孩子的发展都不需要特殊干预</li>
              <li>• 我们会根据行为特征给出建议强度：持续观察 / 情绪支持 / 适度引导</li>
              <li>• 不会给"必须行动"的心理暗示，请放心记录</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              保存并分析
            </button>
            <a
              href={`/children/${child.id}`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              取消
            </a>
          </div>
        </form>
      </main>
    </div>
  )
}
