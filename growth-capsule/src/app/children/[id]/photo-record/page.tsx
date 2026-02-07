import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { PhotoRecordForm } from '@/components/PhotoRecordForm'

export default async function PhotoRecordPage({
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

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">
            📷 拍照记录 {child.name} 的成长瞬间
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 提示卡片 */}
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-brand-700">
            💡 <strong>温馨提示：</strong>
            拍照记录可以捕捉珍贵的成长瞬间。同时添加行为描述和情境说明，可以获得更准确的心理分析。
          </p>
        </div>

        <PhotoRecordForm childId={child.id} />
      </main>
    </div>
  )
}
