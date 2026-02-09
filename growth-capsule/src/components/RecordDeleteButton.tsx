'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RecordDeleteButtonProps {
  recordId: string
}

export function RecordDeleteButton({ recordId }: RecordDeleteButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/records/${recordId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete record')
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('删除失败，请重试')
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
        <p className="text-xs text-red-800 mb-2 font-medium">确定删除？此操作无法撤销。</p>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isDeleting ? '删除中...' : '确认删除'}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md text-xs hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
      title="删除记录"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}
