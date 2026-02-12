import { useState, useEffect } from 'react'
import { View, Text, Button, Image, Input, Textarea } from '@tarojs/components'
import Taro, { useRouter, useLoad, chooseImage } from '@tarojs/taro'
import { childrenApi, Child } from '../../api/children'
import { recordsApi } from '../../api/records'
import { BEHAVIOR_CATEGORIES } from '../../types'
import './index.scss'

export default function PhotoRecordPage() {
  const router = useRouter()
  const childId = router.params.childId as string

  const [child, setChild] = useState<Child | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [imageUrl, setImageUrl] = useState('')
  const [behavior, setBehavior] = useState('')
  const [notes, setNotes] = useState('')
  const [category, setCategory] = useState('motor')

  useEffect(() => {
    loadChild()
  }, [childId])

  const loadChild = async () => {
    try {
      const res = await childrenApi.get(childId)
      if (res.success && res.data) {
        setChild(res.data)
      }
    } catch (error) {
      console.error('Failed to load child:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChooseImage = async () => {
    try {
      const res = await chooseImage({
        count: 1,
        sizeType: 'original',
        sourceType: ['album', 'camera'],
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        // Upload image
        Taro.showLoading({ title: '上传中...' })

        const uploadRes = await Taro.uploadFile({
          url: `${process.env.TARO_APP_API_BASE}/api/upload/image`,
          filePath: res.tempFilePaths[0],
          name: 'photo',
          header: {
            'Content-Type': 'multipart/form-data',
          },
        })

        Taro.hideLoading()

        if (uploadRes.statusCode === 200) {
          const data = JSON.parse(uploadRes.data)
          setImageUrl(data.url)
        }
      }
    } catch (error) {
      console.error('Choose image failed:', error)
      Taro.showToast({
        title: '选择图片失败',
        icon: 'error',
      })
    }
  }

  const handleSubmit = async () => {
    if (!imageUrl) {
      Taro.showToast({
        title: '请先拍照或选择图片',
        icon: 'none',
      })
      return
    }

    if (!behavior.trim()) {
      Taro.showToast({
        title: '请输入行为描述',
        icon: 'none',
      })
      return
    }

    if (!child) return

    try {
      setSaving(true)

      const ageInMonths = Math.floor(
        (Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      )

      const res = await recordsApi.create(childId, {
        category,
        behavior: behavior.trim(),
        date: new Date().toISOString(),
        ageInMonths,
        notes: notes.trim() || undefined,
      })

      if (res.success) {
        // If image was uploaded, update record with image
        if (imageUrl) {
          await Taro.request({
            url: `${process.env.TARO_APP_API_BASE}/api/children/${childId}/record-with-image`,
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            data: {
              recordId: res.data.id,
              imageUrl,
            },
          })
        }

        Taro.showToast({
          title: '记录成功',
          icon: 'success',
        })
        setTimeout(() => {
          Taro.navigateBack()
        }, 500)
      }
    } catch (error) {
      console.error('Submit failed:', error)
      Taro.showToast({
        title: '保存失败',
        icon: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryChange = (e: any) => {
    setCategory(e.detail.value)
  }

  if (loading) {
    return (
      <View className='photo-record-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='photo-record-page'>
      {/* Header */}
      <View className='record-header'>
        <Text className='header-title'>图文记录</Text>
        <Text className='header-subtitle'>拍照并记录成长瞬间</Text>
      </View>

      <View className='record-container'>
        {/* Image picker */}
        <View className='image-section'>
          {imageUrl ? (
            <View className='image-preview'>
              <Image
                src={imageUrl}
                mode='aspectFill'
                className='preview-img'
              />
              <View className='image-actions'>
                <View className='retake-btn' onClick={handleChooseImage}>
                  <Text className='retake-text'>重新拍摄</Text>
                </View>
              </View>
            </View>
          ) : (
            <View className='image-placeholder' onClick={handleChooseImage}>
              <Text className='placeholder-icon'>📷</Text>
              <Text className='placeholder-text'>点击拍照或选择图片</Text>
            </View>
          )}
        </View>

        {/* Category selector */}
        <View className='form-section'>
          <Text className='form-label'>行为类别</Text>
          <View className='category-buttons'>
            {BEHAVIOR_CATEGORIES.map(cat => (
              <View
                key={cat.value}
                className={`category-btn ${category === cat.value ? 'category-btn-active' : ''}`}
                onClick={() => setCategory(cat.value)}
              >
                <Text className='category-icon'>{cat.icon}</Text>
                <Text className='category-label-small'>{cat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Behavior input */}
        <View className='form-section'>
          <Text className='form-label'>行为描述 *</Text>
          <Textarea
            className='form-textarea'
            placeholder='记录孩子的行为或表现...'
            value={behavior}
            onInput={(e) => setBehavior(e.detail.value)}
            maxlength={200}
            autoHeight
          />
          <Text className='char-count'>{behavior.length}/200</Text>
        </View>

        {/* Notes textarea */}
        <View className='form-section'>
          <Text className='form-label'>备注说明</Text>
          <Textarea
            className='form-textarea'
            placeholder='补充更多细节...'
            value={notes}
            onInput={(e) => setNotes(e.detail.value)}
            maxlength={500}
            autoHeight
          />
          <Text className='char-count'>{notes.length}/500</Text>
        </View>

        {/* Submit button */}
        <View className='submit-section'>
          <View
            className={`submit-btn ${!imageUrl || !behavior.trim() || saving ? 'submit-btn-disabled' : ''}`}
            onClick={handleSubmit}
          >
            <Text className='submit-btn-text'>
              {saving ? '保存中...' : '保存记录'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
