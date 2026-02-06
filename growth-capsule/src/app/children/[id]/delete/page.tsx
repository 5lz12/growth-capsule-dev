import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export default async function DeleteChildPage({
  params,
}: {
  params: { id: string }
}) {
  const child = await prisma.child.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: { records: true },
      },
    },
  })

  if (!child) {
    redirect('/')
  }

  async function deleteChild() {
    'use server'

    await prisma.child.delete({
      where: { id: params.id },
    })

    revalidatePath('/')
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              确认删除
            </h1>
            <p className="text-gray-600">
              您确定要删除 <span className="font-semibold text-gray-800">{child.name}</span> 吗？
            </p>
          </div>

          <div className="bg-red-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 font-medium mb-2">
              ⚠️ 此操作将永久删除：
            </p>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• 孩子的基本信息</li>
              <li>• 所有相关记录（{child._count.records} 条）</li>
              <li>• 所有心理学分析结果</li>
            </ul>
            <p className="text-xs text-red-600 mt-3 font-semibold">
              此操作不可撤销，请谨慎操作！
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-600">
              <strong>创建时间：</strong>{new Date(child.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>

          <form action={deleteChild}>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                确认删除
              </button>
              <a
                href={`/children/${params.id}`}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </a>
            </div>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            如果您只是想编辑信息，可以
            <a
              href={`/children/${params.id}/edit`}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              点击此处编辑资料
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
