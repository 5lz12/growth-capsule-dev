'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BEHAVIOR_CATEGORIES } from '@/types'

interface UnifiedRecordFormProps {
  childId: string
  childName: string
}

export function UnifiedRecordForm({ childId, childName }: UnifiedRecordFormProps) {
  const router = useRouter()
  const [behavior, setBehavior] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 简单的分类建议逻辑（基于关键词）
  const suggestCategory = (text: string) => {
    const lowerText = text.toLowerCase()

    if (lowerText.match(/走|跑|跳|爬|站|坐|翻身|踢|抓|握|击剑|运动|球/)) {
      return 'motor'
    }
    if (lowerText.match(/说|叫|话|词|语言|读|念|讲|问|回答|聊/)) {
      return 'language'
    }
    if (lowerText.match(/朋友|分享|帮助|合作|玩伴|一起|交流|微笑|拥抱/)) {
      return 'social'
    }
    if (lowerText.match(/数|算|认识|思考|问题|为什么|颜色|形状|记忆|理解/)) {
      return 'cognitive'
    }
    if (lowerText.match(/哭|笑|开心|生气|害怕|难过|情绪|感受|害羞|兴奋/)) {
      return 'emotional'
    }

    return null
  }

  const handleBehaviorChange = (value: string) => {
    setBehavior(value)
    // 实时建议分类
    const suggested = suggestCategory(value)
    setSuggestedCategory(suggested)
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    let fileToUse = file

    // 检查是否是 HEIC/HEIF 格式并自动转换
    const isHEIC = file.type === 'image/heic' || file.type === 'image/heif' ||
                   file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')

    if (isHEIC) {
      try {
        setIsConverting(true)
        console.log('[UnifiedRecordForm] Converting HEIC to JPEG...')

        // 动态导入 heic2any（仅在客户端）
        const heic2any = (await import('heic2any')).default

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

        console.log('[UnifiedRecordForm] HEIC converted successfully:', fileToUse.name, fileToUse.size, 'bytes')
      } catch (error) {
        console.error('[UnifiedRecordForm] HEIC conversion failed:', error)
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
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(fileToUse)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
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

      // 使用建议的分类，如果没有则默认为认知类
      const finalCategory = suggestedCategory || 'cognitive'

      formData.append('category', finalCategory)
      formData.append('behavior', behavior)
      formData.append('date', date)
      formData.append('notes', notes)

      if (imageFile) {
        formData.append('image', imageFile)
      }

      const endpoint = imageFile
        ? `/api/children/${childId}/record-with-image`
        : `/api/children/${childId}/records`

      const response = await fetch(endpoint, {
        method: 'POST',
        body: imageFile ? formData : JSON.stringify({
          category: finalCategory,
          behavior,
          date,
          notes,
        }),
        headers: imageFile ? {} : {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to create record')
      }

      router.push(`/children/${childId}`)
      router.refresh()
    } catch (error) {
      console.error('Error creating record:', error)
      alert('保存失败，请重试')
      setIsSubmitting(false)
    }
  }

  const categoryInfo = suggestedCategory
    ? BEHAVIOR_CATEGORIES.find(c => c.value === suggestedCategory)
    : null

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6">
      {/* 温馨提示 */}
      <div className="bg-gradient-to-r from-brand-50 to-accent-50 border border-brand-200 rounded-2xl p-5 mb-6 text-center">
        <p className="text-brand-700 text-base font-medium mb-1">
          ✨ 别担心格式，我会帮你整理
        </p>
        <p className="text-sm text-gray-600">
          随意记录，AI会自动识别类别并提供专业分析。支持 iPhone HEIC 格式照片自动转换。
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

      {/* 主输入区域 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* 文字输入 */}
        <div className="p-6">
          <textarea
            value={behavior}
            onChange={(e) => handleBehaviorChange(e.target.value)}
            placeholder="记录今天的成长瞬间...&#10;&#10;例如：今天在游乐场和小朋友一起玩滑梯，主动分享了自己的玩具"
            rows={6}
            className="w-full text-base text-gray-800 placeholder-gray-400 outline-none resize-none"
            required
          />

          {/* AI 识别的分类提示 */}
          {categoryInfo && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-full">
              <span className="text-lg">{categoryInfo.icon}</span>
              <span className="text-sm text-brand-700">
                AI识别为：{categoryInfo.label}
              </span>
            </div>
          )}
        </div>

        {/* 图片预览 */}
        {imagePreview && (
          <div className="px-6 pb-4">
            <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
              <img
                src={imagePreview}
                alt="上传的图片"
                className="w-full max-h-96 object-contain"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 底部工具栏 */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {/* 图片按钮 */}
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
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              title="添加图片"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </label>

            {/* 语音按钮（占位） */}
            <button
              type="button"
              className="p-2 rounded-lg opacity-40 cursor-not-allowed"
              title="语音输入（即将上线）"
              disabled
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            {/* 日期 */}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !behavior.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-medium hover:from-brand-600 hover:to-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? '存入中...' : '🌱 存入胶囊'}
          </button>
        </div>
      </div>

      {/* 补充情境（可选） */}
      <details className="mt-4">
        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors">
          + 添加更多情境信息（可选）
        </summary>
        <div className="mt-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="例如：当时在客厅玩，持续了约10分钟，孩子很开心..."
            rows={3}
            className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none resize-none"
          />
        </div>
      </details>

      {/* 设计原则说明 */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-700 mb-2">🎗️ 我们的设计原则</p>
        <ul className="space-y-1 text-xs text-gray-500">
          <li>• 大部分情况下，孩子的发展都不需要特殊干预</li>
          <li>• 我们会根据行为特征给出建议强度：持续观察 / 情绪支持 / 适度引导</li>
          <li>• 不会给"必须行动"的心理暗示，请放心记录</li>
        </ul>
      </div>
    </form>
  )
}
