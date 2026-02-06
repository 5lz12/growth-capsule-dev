'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface AvatarUploadProps {
  childId: string
  currentAvatar?: string | null
  gender: string
}

export function AvatarUpload({ childId, currentAvatar, gender }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch(`/api/children/${childId}/avatar`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '上传失败')
      }

      const data = await response.json()
      setAvatarUrl(data.avatarUrl)
    } catch (error) {
      console.error('头像上传失败:', error)
      alert('头像上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        {/* 头像显示 */}
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-4 border-white shadow-lg">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="头像"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-6xl">{gender === 'male' ? '👦' : '👧'}</span>
          )}
        </div>

        {/* 上传按钮 */}
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <span className="text-sm">⏳</span>
          ) : (
            <span className="text-lg">📷</span>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-sm text-gray-500 text-center">
        {uploading ? '上传中...' : '点击相机图标上传头像'}
      </p>
      <p className="text-xs text-gray-400">
        支持 JPG、PNG 格式，最大 5MB
      </p>
    </div>
  )
}
