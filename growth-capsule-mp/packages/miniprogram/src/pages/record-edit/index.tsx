import { useState, useEffect } from 'react'
import { View, Text, Input, Textarea, ScrollView, Picker } from '@tarojs/components'
import Taro, { useRouter, useLoad } from '@tarojs/taro'
import { recordsApi, Record } from '../../api/records'
import { BEHAVIOR_CATEGORIES } from '../../types'
import './index.scss'

export default function RecordEditPage() {
  const router = useRouter()
  const recordId = router.params.id as string

  const [record, setRecord] = useState<Record | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [behavior, setBehavior] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('motor')

  useEffect(() => {
    loadRecord()
  }, [recordId])

  const loadRecord = async () => {
    try {
      const res = await recordsApi.getById(recordId)
      if (res.success && res.data) {
        const r = res.data
        setRecord(r)
        setBehavior(r.behavior)
        setNotes(r.notes || '')
        setDate(r.date.split('T')[0])
        setCategory(r.category)
      }
    } catch (error) {
      console.error('Failed to load record:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!behavior.trim()) {
      Taro.showToast({
        title: '请输入行为描述',
        icon: 'none',
      })
      return
    }

    try {
      setSaving(true)
      const res = await recordsApi.update(recordId, {
        behavior: behavior.trim(),
        notes: notes.trim() || undefined,
        category,
      })
      if (res.success) {
        Taro.showToast({
          title: '保存成功',
          icon: 'success',
        })
        setTimeout(() => {
          Taro.navigateBack()
        }, 500)
      }
    } catch (error) {
      console.error('Failed to save record:', error)
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

  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString().split('T')[0]
    return dateStr
  }

  if (loading) {
    return (
      <View className='record-edit-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='record-edit-page'>
      <ScrollView scrollY className='edit-scroll'>
        <View className='edit-container'>
          {/* Header */}
          <View className='edit-header'>
            <Text className='header-title'>编辑记录</Text>
          </View>

          {/* Behavior input */}
          <View className='form-section'>
            <Text className='form-label'>行为描述 *</Text>
            <Input
              className='form-input'
              placeholder='记录孩子的行为或表现'
              value={behavior}
              onInput={(e) => setBehavior(e.detail.value)}
            />
          </View>

          {/* Category selector */}
          <View className='form-section'>
            <Text className='form-label'>行为类别</Text>
            <View className='category-selector'>
              <Picker
                mode='selector'
                range={BEHAVIOR_CATEGORIES.map(c => ({
                  label: `${c.icon} ${c.label}`,
                  value: c.value,
                }))}
                value={category}
                onChange={handleCategoryChange}
              >
                <View className='category-trigger'>
                  <Text className='category-text'>
                    {BEHAVIOR_CATEGORIES.find(c => c.value === category)?.label || '选择类别'}
                  </Text>
                  <Text className='category-arrow'>›</Text>
                </View>
              </Picker>
            </View>
          </View>

          {/* Date display */}
          <View className='form-section'>
            <Text className='form-label'>记录日期</Text>
            <View className='date-display'>
              <Text className='date-text'>{formatDateForDisplay(date)}</Text>
            </View>
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

          {/* Save button */}
          <View className='save-section'>
            <View
              className={`save-btn ${saving ? 'save-btn-disabled' : ''}`}
              onClick={handleSave}
            >
              <Text className='save-btn-text'>
                {saving ? '保存中...' : '保存修改'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
