import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { BEHAVIOR_CATEGORIES } from '@/types'
import { analyzerManager } from '@/lib/analyzers/analyzer-manager'

export default async function EditRecordPage({
  params,
}: {
  params: { id: string; recordId: string }
}) {
  // 获取记录和相关信息
  const record = await prisma.record.findUnique({
    where: { id: params.recordId },
  })

  const child = await prisma.child.findUnique({
    where: { id: params.id },
  })

  if (!record || !child) {
    redirect('/')
  }

  async function updateRecord(formData: FormData) {
    'use server'

    const category = formData.get('category') as string
    const behavior = formData.get('behavior') as string
    const date = formData.get('date') as string
    const notes = formData.get('notes') as string

    if (!category || !behavior || !date) {
      return
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

    // 使用分析器重新生成分析
    const analysisResult = await analyzerManager.analyze({
      childAge: ageInMonths,
      behavior,
      context: notes,
      category,
    })

    // 保存结构化JSON格式
    const structuredAnalysis = JSON.stringify(analysisResult)

    // 更新记录
    await prisma.record.update({
      where: { id: params.recordId },
      data: {
        category,
        behavior,
        date: recordDate,
        ageInMonths,
        notes,
        analysis: structuredAnalysis,
        milestones: analysisResult.milestone,
      },
    })

    redirect(`/children/${params.id}`)
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">
            编辑记录
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            💡 <strong>提示：</strong>
            修改发展领域后，系统将重新生成心理学分析。
          </p>
        </div>

        <form action={updateRecord} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              发展领域 *
            </label>
            <select
              id="category"
              name="category"
              required
              defaultValue={record.category}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">请选择类别</option>
              {BEHAVIOR_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              原类别：{BEHAVIOR_CATEGORIES.find(c => c.value === record.category)?.label}
            </p>
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
              defaultValue={record.behavior}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
            />
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
              defaultValue={new Date(record.date).toISOString().split('T')[0]}
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
              defaultValue={record.notes || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-2">📝 当前记录信息</p>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>• 原类别：{BEHAVIOR_CATEGORIES.find(c => c.value === record.category)?.label}</li>
              <li>• 创建时间：{new Date(record.createdAt).toLocaleString('zh-CN')}</li>
              <li>• 最后更新：{new Date(record.updatedAt).toLocaleString('zh-CN')}</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              保存修改
            </button>
            <a
              href={`/children/${params.id}`}
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
