import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter, usePullDownRefresh } from '@tarojs/taro'
import { childrenApi, Child, ChildRecord } from '../../api/children'
import './index.scss'

const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  motor: { label: '运动发展', icon: '🏃' },
  language: { label: '语言发展', icon: '🗣️' },
  social: { label: '社交能力', icon: '👥' },
  cognitive: { label: '认知发展', icon: '🧠' },
  emotional: { label: '情感发展', icon: '❤️' },
}

function formatAge(ageInMonths: number): string {
  const years = Math.floor(ageInMonths / 12)
  const months = ageInMonths % 12
  if (years === 0) return `${months}个月`
  if (months === 0) return `${years}岁`
  return `${years}岁${months}个月`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function ChildDetailPage() {
  const router = useRouter()
  const childId = router.params.id as string

  const [child, setChild] = useState<Child | null>(null)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    loadChild()
  }, [childId])

  usePullDownRefresh(async () => {
    await loadChild()
    Taro.stopPullDownRefresh()
  })

  const navigateToRecord = (type: string) => {
    const urlMap: Record<string, string> = {
      text: `/pages/record/index?childId=${childId}`,
      voice: `/pages/voice-record/index?childId=${childId}`,
      photo: `/pages/photo-record/index?childId=${childId}`,
    }
    Taro.navigateTo({ url: urlMap[type] || urlMap.text })
  }

  const navigateToRecordDetail = (recordId: string) => {
    Taro.navigateTo({ url: `/pages/record-detail/index?id=${recordId}` })
  }

  const navigateToEdit = () => {
    Taro.navigateTo({ url: `/pages/child-edit/index?id=${childId}` })
  }

  if (loading) {
    return (
      <View className='child-detail-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!child) {
    return (
      <View className='child-detail-page'>
        <View className='empty-state'>
          <Text>孩子信息不存在</Text>
        </View>
      </View>
    )
  }

  const ageInMonths = Math.floor(
    (Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  )
  const records = child.records || []

  return (
    <View className='child-detail-page'>
      {/* Profile card */}
      <View className='profile-card'>
        <View className='profile-info'>
          {child.avatarUrl ? (
            <Image src={child.avatarUrl} className='avatar' mode='aspectFill' />
          ) : (
            <View className='avatar-placeholder'>
              <Text className='avatar-text'>{child.name[0]}</Text>
            </View>
          )}
          <View className='profile-text'>
            <Text className='child-name'>{child.name}</Text>
            <Text className='child-age'>
              {formatAge(ageInMonths)} · {child.gender === 'male' ? '男孩' : '女孩'}
            </Text>
          </View>
          <View className='edit-btn' onClick={navigateToEdit}>
            <Text className='edit-btn-text'>编辑</Text>
          </View>
        </View>
        <View className='stats-row'>
          <View className='stat-item'>
            <Text className='stat-value'>{records.length}</Text>
            <Text className='stat-label'>记录</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{records.filter(r => r.isFavorite).length}</Text>
            <Text className='stat-label'>收藏</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{records.filter(r => r.imageUrl).length}</Text>
            <Text className='stat-label'>照片</Text>
          </View>
        </View>
      </View>

      {/* Quick record actions */}
      <View className='action-section'>
        <Text className='section-title'>记录成长</Text>
        <View className='action-row'>
          <View className='action-btn' onClick={() => navigateToRecord('text')}>
            <Text className='action-icon'>✏️</Text>
            <Text className='action-label'>文字</Text>
          </View>
          <View className='action-btn' onClick={() => navigateToRecord('photo')}>
            <Text className='action-icon'>📸</Text>
            <Text className='action-label'>图文</Text>
          </View>
          <View className='action-btn' onClick={() => navigateToRecord('voice')}>
            <Text className='action-icon'>🎤</Text>
            <Text className='action-label'>语音</Text>
          </View>
        </View>
      </View>

      {/* Records list */}
      <View className='records-section'>
        <Text className='section-title'>成长记录 ({records.length})</Text>
        {records.length === 0 ? (
          <View className='no-records'>
            <Text className='no-records-icon'>📝</Text>
            <Text className='no-records-text'>还没有记录，快去记录第一个成长瞬间吧</Text>
          </View>
        ) : (
          records
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((record: ChildRecord) => {
              const cat = CATEGORY_MAP[record.category]
              return (
                <View
                  key={record.id}
                  className='record-item'
                  onClick={() => navigateToRecordDetail(record.id)}
                >
                  <View className='record-left'>
                    <Text className='record-icon'>{cat?.icon || '📝'}</Text>
                    <View className='record-info'>
                      <Text className='record-behavior'>{record.behavior}</Text>
                      <Text className='record-meta'>
                        {cat?.label || record.category} · {formatDate(record.date)}
                      </Text>
                    </View>
                  </View>
                  <View className='record-right'>
                    {record.isFavorite && <Text className='favorite-icon'>⭐</Text>}
                    {record.imageUrl && <Text className='image-icon'>🖼️</Text>}
                    <Text className='arrow'>›</Text>
                  </View>
                </View>
              )
            })
        )}
      </View>
    </View>
  )
}
