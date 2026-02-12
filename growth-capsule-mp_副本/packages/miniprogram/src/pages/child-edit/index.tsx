import { useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useRouter, useLoad } from '@tarojs/taro'
import { childrenApi } from '../../api/children'
import './index.scss'

export default function ChildEditPage() {
  const router = useRouter()
  const childId = router.params.id as string

  const [child, setChild] = useState<{ name: string; birthDate: string; gender: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadChild()
  }, [childId])

  const loadChild = async () => {
    try {
      const res = await childrenApi.get(childId)
      if (res.success && res.data) {
        setChild({
          name: res.data.name,
          birthDate: res.data.birthDate.split('T')[0],
          gender: res.data.gender,
        })
      }
    } catch (error) {
      console.error('Failed to load child:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!child?.name.trim()) {
      Taro.showToast({
        title: '请输入孩子姓名',
        icon: 'none',
      })
      return
    }

    try {
      setSaving(true)
      const res = await childrenApi.update(childId, {
        name: child.name.trim(),
        birthDate: new Date(child.birthDate).toISOString(),
        gender: child.gender,
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
      console.error('Failed to save child:', error)
      Taro.showToast({
        title: '保存失败',
        icon: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const calculateAge = (birthDate: string): number => {
    const months = Math.floor(
      (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    )
    return months
  }

  if (loading) {
    return (
      <View className='child-edit-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='child-edit-page'>
      <View className='edit-container'>
        {/* Header */}
        <View className='edit-header'>
          <Text className='header-title'>编辑孩子信息</Text>
        </View>

        {/* Name input */}
        <View className='form-section'>
          <Text className='form-label'>孩子姓名 *</Text>
          <Input
            className='form-input'
            placeholder='请输入姓名'
            value={child?.name || ''}
            onInput={(e) => setChild({ ...child!, name: e.detail.value })}
          />
        </View>

        {/* Birth date input */}
        <View className='form-section'>
          <Text className='form-label'>出生日期 *</Text>
          <View className='date-input-wrapper'>
            <Input
              className='form-input'
              type='date'
              value={child?.birthDate || ''}
              onInput={(e) => setChild({ ...child!, birthDate: e.detail.value })}
            />
          </View>
        </View>

        {/* Gender selector */}
        <View className='form-section'>
          <Text className='form-label'>性别 *</Text>
          <View className='gender-options'>
            <View
              className={`gender-option ${child?.gender === 'male' ? 'gender-selected' : ''}`}
              onClick={() => setChild({ ...child!, gender: 'male' })}
            >
              <Text className='gender-icon'>👦</Text>
              <Text className='gender-label'>男孩</Text>
            </View>
            <View
              className={`gender-option ${child?.gender === 'female' ? 'gender-selected' : ''}`}
              onClick={() => setChild({ ...child!, gender: 'female' })}
            >
              <Text className='gender-icon'>👧</Text>
              <Text className='gender-label'>女孩</Text>
            </View>
          </View>
        </View>

        {/* Current age display */}
        {child && (
          <View className='age-display'>
            <Text className='age-label'>当前年龄：</Text>
            <Text className='age-value'>{calculateAge(child.birthDate)} 个月</Text>
          </View>
        )}

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

        {/* Delete button */}
        <View className='delete-section'>
          <View className='delete-btn' onClick={() => {
            Taro.showModal({
              title: '确认删除',
              content: '删除后将无法恢复，确认要删除这个孩子的信息吗？',
              success: async () => {
                try {
                  const res = await childrenApi.delete(childId)
                  if (res.success) {
                    Taro.showToast({
                      title: '删除成功',
                      icon: 'success',
                    })
                    Taro.switchTab({
                      url: '/pages/home/index',
                    })
                  }
                } catch (error) {
                  console.error('Delete failed:', error)
                  Taro.showToast({
                    title: '删除失败',
                    icon: 'error',
                  })
                }
              },
            })
          }}>
            <Text className='delete-btn-text'>删除孩子</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
