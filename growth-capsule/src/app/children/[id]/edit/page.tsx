import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { AvatarUpload } from '@/components/AvatarUpload'

export default async function EditChildPage({
  params,
}: {
  params: { id: string }
}) {
  const child = await prisma.child.findUnique({
    where: { id: params.id },
  })

  if (!child) {
    redirect('/')
  }

  async function updateChild(formData: FormData) {
    'use server'

    const name = formData.get('name') as string
    const birthDate = formData.get('birthDate') as string
    const gender = formData.get('gender') as string

    if (!name || !birthDate || !gender) {
      return
    }

    await prisma.child.update({
      where: { id: params.id },
      data: {
        name,
        birthDate: new Date(birthDate),
        gender,
      },
    })

    redirect(`/children/${params.id}`)
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">
            编辑孩子资料
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-brand-700">
            💡 <strong>提示：</strong>
            修改出生日期会影响所有记录的月龄计算，但不会重新生成心理学分析。
          </p>
        </div>

        <form action={updateChild} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* 头像上传 */}
          <div className="flex justify-center pb-6 border-b border-gray-100">
            <AvatarUpload
              childId={params.id}
              currentAvatar={child.avatarUrl}
              gender={child.gender}
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              名字 *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={child.name}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-brand-400 outline-none transition-all"
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
              defaultValue={new Date(child.birthDate).toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-brand-400 outline-none transition-all"
            />
            <p className="mt-1 text-xs text-amber-600">
              ⚠️ 修改出生日期会重新计算所有记录的月龄
            </p>
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
                  defaultChecked={child.gender === 'male'}
                  className="w-4 h-4 text-brand-500"
                />
                <span>男孩 👦</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  required
                  defaultChecked={child.gender === 'female'}
                  className="w-4 h-4 text-brand-500"
                />
                <span>女孩 👧</span>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-2">📝 当前记录信息</p>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>• 原名字：{child.name}</li>
              <li>• 原出生日期：{new Date(child.birthDate).toLocaleDateString('zh-CN')}</li>
              <li>• 原性别：{child.gender === 'male' ? '男孩' : '女孩'}</li>
              <li>• 创建时间：{new Date(child.createdAt).toLocaleString('zh-CN')}</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
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

        {/* 危险操作区 */}
        <div className="mt-6 p-4 border border-red-200 rounded-lg">
          <h3 className="text-sm font-semibold text-red-700 mb-2">⚠️ 其他操作</h3>
          <p className="text-xs text-gray-500 mb-3">
            删除孩子将同时删除所有相关记录，此操作不可撤销。
          </p>
          <a
            href={`/children/${params.id}/delete`}
            className="inline-block px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            删除这个孩子
          </a>
        </div>
      </main>
    </div>
  )
}
