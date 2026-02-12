import { useState, useEffect } from 'react'
import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { childrenApi, Child } from '../../api/children'
import { recordsApi } from '../../api/records'
import './index.scss'

// 行为类别常量
const BEHAVIOR_CATEGORIES = [
  { value: 'motor', label: '运动发展', icon: '🏃' },
  { value: 'language', label: '语言发展', icon: '🗣️' },
  { value: 'social', label: '社交能力', icon: '👥' },
  { value: 'cognitive', label: '认知发展', icon: '🧠' },
  { value: 'emotional', label: '情感发展', icon: '❤️' },
] as const

export default function RecordPage() {
  const router = useRouter()
  const childId = router.params.childId as string

  const [child, setChild] = useState<Child | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

  const handleSubmit = async () => {
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
      <View className='record-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='record-page'>
      {/* Header */}
      <View className='record-header'>
        <Text className='header-title'>文字记录</Text>
        <Text className='header-subtitle'>记录孩子的行为和语言</Text>
      </View>

      <View className='record-container'>
        {/* Child info */}
        {child && (
          <View className='child-info'>
            <Text className='child-name'>{child.name}</Text>
            <Text className='child-age'>
              {Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))} 个月
            </Text>
          </View>
        )}

        {/* Category selector */}
        <View className='form-section'>
          <Text className='form-label'>行为类别</Text>
          <View className='category-grid'>
            {BEHAVIOR_CATEGORIES.map(cat => (
              <View
                key={cat.value}
                className={`category-item ${category === cat.value ? 'category-item-active' : ''}`}
                onClick={() => setCategory(cat.value)}
              >
                <Text className='category-icon'>{cat.icon}</Text>
                <Text className='category-label'>{cat.label}</Text>
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
            focus
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
              className={`submit-btn ${!behavior.trim() || saving ? 'submit-btn-disabled' : ''}`}
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
