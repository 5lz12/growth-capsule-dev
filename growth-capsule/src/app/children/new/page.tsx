import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getServerUid } from '@/lib/auth'

export default function NewChildPage() {
  async function addChild(formData: FormData) {
    'use server'

    const ownerUid = getServerUid()
    const name = formData.get('name') as string
    const birthDate = formData.get('birthDate') as string
    const gender = formData.get('gender') as string

    if (!name || !birthDate || !gender) {
      return // 表单验证由 HTML required 属性处理
    }

    const child = await prisma.child.create({
      data: {
        name,
        birthDate: new Date(birthDate),
        gender,
        ownerUid,
      },
    })

    redirect(`/children/${child.id}`)
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">添加孩子</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form action={addChild} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              名字 *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="例如：小明"
            />
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
              出生日期 *
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              性别 *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  required
                  className="w-4 h-4 text-blue-600"
                />
                <span>男孩 👦</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  required
                  className="w-4 h-4 text-blue-600"
                />
                <span>女孩 👧</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              保存
            </button>
            <a
              href="/"
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
