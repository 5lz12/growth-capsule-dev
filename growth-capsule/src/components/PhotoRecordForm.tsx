'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BEHAVIOR_CATEGORIES } from '@/types'

interface PhotoRecordFormProps {
  childId: string
}

export function PhotoRecordForm({ childId }: PhotoRecordFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [useCamera, setUseCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const [formData, setFormData] = useState({
    category: '',
    behavior: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  // 启动相机
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setUseCamera(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('无法访问相机，请检查权限设置或使用相册上传')
      setUseCamera(false)
    }
  }

  // 停止相机
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setUseCamera(false)
  }

  // 拍照
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(videoRef.current, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          setPreviewUrl(url)
          stopCamera()
        }
      }, 'image/jpeg', 0.9)
    }
  }

  // 选择文件
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  // 上传图片并创建记录
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.category || !formData.behavior || !formData.date) {
      alert('请填写必填字段')
      return
    }

    if (!previewUrl) {
      alert('请先拍照或上传图片')
      return
    }

    setIsUploading(true)

    try {
      // 将 blob URL 转换为 File 对象
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })

      // 上传图片
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const uploadRes = await fetch('/api/upload/image', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!uploadRes.ok) {
        throw new Error('图片上传失败')
      }

      const { url } = await uploadRes.json()

      // 创建记录
      const createRes = await fetch(`/api/children/${childId}/record-with-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: url,
        }),
      })

      if (!createRes.ok) {
        throw new Error('记录创建失败')
      }

      router.push(`/children/${childId}`)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('保存失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      {/* 图片区域 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          拍照记录 *
        </label>

        {!previewUrl ? (
          <div className="space-y-3">
            {!useCamera ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-4xl mb-2">📷</span>
                  <span className="text-sm font-medium text-gray-700">拍照</span>
                </button>

                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <span className="text-4xl mb-2">🖼️</span>
                  <span className="text-sm font-medium text-gray-700">相册</span>
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    拍照
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden border border-gray-200">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full"
              />
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
              >
                重新拍摄
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 文本信息 */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          行为类别 *
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        >
          <option value="">请选择类别</option>
          {BEHAVIOR_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="behavior" className="block text-sm font-medium text-gray-700 mb-2">
          具体行为描述 *
        </label>
        <textarea
          id="behavior"
          value={formData.behavior}
          onChange={(e) => setFormData({ ...formData, behavior: e.target.value })}
          required
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
          placeholder="描述照片中的场景和行为..."
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          发生日期 *
        </label>
        <input
          type="date"
          id="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          额外说明（可选）
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
          placeholder="补充情境信息有助于获得更准确的分析..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isUploading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? '保存中...' : '保存并分析'}
        </button>
        <a
          href={`/children/${childId}`}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
        >
          取消
        </a>
      </div>
    </form>
  )
}
