'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BEHAVIOR_CATEGORIES } from '@/types'
import heic2any from 'heic2any'

interface RecordEditFormProps {
  child: any
  record: any
}

export function RecordEditForm({ child, record }: RecordEditFormProps) {
  const router = useRouter()
  const [behavior, setBehavior] = useState(record.behavior)
  const [category, setCategory] = useState(record.category)
  const [notes, setNotes] = useState(record.notes || '')
  const [date, setDate] = useState(new Date(record.date).toISOString().split('T')[0])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(record.imageUrl)
  const [removeImage, setRemoveImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('[RecordEditForm] Selected file:', file.name, file.type, file.size, 'bytes')

    // 验证文件类型
    if (!file.type.startsWith('image/') && !file.name.toLowerCase().match(/\.(heic|heif)$/)) {
      alert('请选择图片文件')
      return
    }

    // 验证文件大小（限制 10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('图片文件太大，请选择小于 10MB 的图片')
      return
    }

    let fileToUse = file

    // 检查是否是 HEIC/HEIF 格式并自动转换
    const isHEIC = file.type === 'image/heic' || file.type === 'image/heif' ||
                   file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')

    if (isHEIC) {
      try {
        setIsConverting(true)
        console.log('[RecordEditForm] Converting HEIC to JPEG...')

        // 转换 HEIC 为 JPEG
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9
        })

        // heic2any 可能返回数组，取第一个
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob

        // 将 Blob 转为 File
        const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
        fileToUse = new File([blob], newFileName, { type: 'image/jpeg' })

        console.log('[RecordEditForm] HEIC converted successfully:', fileToUse.name, fileToUse.size, 'bytes')
      } catch (error) {
        console.error('[RecordEditForm] HEIC conversion failed:', error)
        alert('图片转换失败，请尝试使用其他格式的图片')
        setIsConverting(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      } finally {
        setIsConverting(false)
      }
    }

    setImageFile(fileToUse)
    setRemoveImage(false)

    // 读取并预览
    const reader = new FileReader()
    reader.onloadend = () => {
      console.log('[RecordEditForm] FileReader finished, result length:', (reader.result as string)?.length)
      setImagePreview(reader.result as string)
    }
    reader.onerror = () => {
      console.error('[RecordEditForm] FileReader error:', reader.error)
      alert('读取图片失败，请重试')
    }
    reader.readAsDataURL(fileToUse)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!behavior.trim()) {
      alert('请描述孩子的行为')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('category', category)
      formData.append('behavior', behavior)
      formData.append('date', date)
      formData.append('notes', notes)
      formData.append('removeImage', removeImage.toString())

      if (imageFile) {
        formData.append('image', imageFile)
      }

      const response = await fetch(`/api/records/${record.id}`, {
        method: 'PUT',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to update record')
      }

      router.push(`/children/${child.id}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating record:', error)
      alert('保存失败，请重试')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6">
      {/* 提示卡片 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-800">
          💡 <strong>提示：</strong>
          修改记录后，系统将重新生成心理学分析。支持 iPhone HEIC 格式照片自动转换。
        </p>
      </div>

      {/* 转换状态提示 */}
      {isConverting && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-amber-800">
              <strong>正在转换 HEIC 图片...</strong> 请稍候
            </p>
          </div>
        </div>
      )}

      {/* 主编辑区域 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* 分类选择 */}
        <div className="p-6 border-b border-gray-100">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            行为类别 *
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-brand-400 outline-none transition-all"
          >
            {BEHAVIOR_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* 文字输入 */}
        <div className="p-6">
          <label htmlFor="behavior" className="block text-sm font-medium text-gray-700 mb-2">
            具体行为 *
          </label>
          <textarea
            id="behavior"
            value={behavior}
            onChange={(e) => setBehavior(e.target.value)}
            rows={6}
            className="w-full text-base text-gray-800 placeholder-gray-400 outline-none resize-none border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
            required
          />
        </div>

        {/* 图片预览/上传 */}
        {imagePreview ? (
          <div className="px-6 pb-4">
            <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
              <img
                src={imagePreview}
                alt="记录图片"
                className="w-full h-64 object-cover"
                onError={(e) => {
                  console.error('[RecordEditForm] Image load error:', imagePreview?.substring(0, 100))
                }}
                onLoad={() => {
                  console.log('[RecordEditForm] Image loaded successfully')
                }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {imageFile ? '已选择新图片' : '当前图片'}
            </p>
          </div>
        ) : (
          <div className="px-6 pb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
              disabled={isConverting}
            />
            <label
              htmlFor="image-upload"
              className="flex items-center justify-center gap-2 w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-brand-400 hover:bg-brand-50 transition-all cursor-pointer"
            >
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-600">点击添加图片</span>
            </label>
          </div>
        )}

        {/* 日期和备注 */}
        <div className="px-6 pb-6 space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              发生日期 *
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-brand-400 outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              发生情境（可选）
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-brand-400 outline-none resize-none"
              placeholder="例如：当时在客厅玩，持续了约10分钟，孩子很开心..."
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !behavior.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-medium hover:from-brand-600 hover:to-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? '保存中...' : '💾 保存修改'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
        </div>
      </div>

      {/* 记录信息 */}
      <div className="mt-4 bg-gray-50 rounded-xl p-4 text-sm">
        <p className="font-medium text-gray-700 mb-2">📝 记录信息</p>
        <ul className="space-y-1 text-xs text-gray-500">
          <li>• 创建时间：{new Date(record.createdAt).toLocaleString('zh-CN')}</li>
          <li>• 最后更新：{new Date(record.updatedAt).toLocaleString('zh-CN')}</li>
          {record.isFavorite && <li>• ⭐ 已收藏</li>}
        </ul>
      </div>
    </form>
  )
}
