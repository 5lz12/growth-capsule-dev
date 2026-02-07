import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { UnifiedRecordForm } from '@/components/UnifiedRecordForm'

export default async function RecordPage({ params }: { params: { id: string } }) {
  const child = await prisma.child.findUnique({
    where: { id: params.id },
  })

  if (!child) {
    redirect('/')
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href={`/children/${child.id}`}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-800">
            记录 {child.name} 的成长瞬间
          </h1>
        </div>
      </header>

      <main>
        <UnifiedRecordForm childId={child.id} childName={child.name} />
      </main>
    </div>
  )
}
