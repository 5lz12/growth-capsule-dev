import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { RecordEditForm } from '@/components/RecordEditForm'

export default async function EditRecordPage({
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

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href={`/children/${params.id}`}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-800">
            编辑记录
          </h1>
        </div>
      </header>

      <main>
        <RecordEditForm child={child} record={record} />
      </main>
    </div>
  )
}
