import { useState, useCallback } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { childrenApi, Child } from '../../api/children'
import './index.scss'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了，注意休息'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

function formatAge(ageInMonths: number): string {
  const years = Math.floor(ageInMonths / 12)
  const months = ageInMonths % 12
  if (years === 0) return `${months}个月`
  if (months === 0) return `${years}岁`
  return `${years}岁${months}个月`
}

export default function HomePage() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const res = await childrenApi.list()
      if (res.success) {
        setChildren(res.data)
      }
    } catch (error) {
      console.error('Failed to load children:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    loadData()
  })

  usePullDownRefresh(async () => {
    await loadData()
    Taro.stopPullDownRefresh()
  })

  const navigateToChild = (childId: string) => {
    Taro.navigateTo({ url: `/pages/child-detail/index?id=${childId}` })
  }

  const navigateToRecord = (childId: string, type: string) => {
    const urlMap: Record<string, string> = {
      text: `/pages/record/index?childId=${childId}`,
      voice: `/pages/voice-record/index?childId=${childId}`,
      photo: `/pages/photo-record/index?childId=${childId}`,
    }
    Taro.navigateTo({ url: urlMap[type] || urlMap.text })
  }

  const navigateToAddChild = () => {
    Taro.navigateTo({ url: '/pages/add-child/index' })
  }

  if (loading) {
    return (
      <View className='home-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  // All records across children, for recent photos and insights
  const allRecords = children.flatMap(child =>
    (child.records || []).map(r => ({ ...r, childName: child.name, childId: child.id }))
  )
  const totalRecords = allRecords.length
  const recentPhotos = allRecords
    .filter(r => r.imageUrl)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  return (
    <View className='home-page'>
      {children.length === 0 ? (
        /* Empty state */
        <View className='empty-state'>
          <Text className='empty-icon'>👶</Text>
          <Text className='empty-title'>开始记录成长时光</Text>
          <Text className='empty-desc'>添加第一个孩子，开始记录珍贵的成长瞬间</Text>
          <View className='empty-btn' onClick={navigateToAddChild}>
            <Text className='empty-btn-text'>添加孩子</Text>
          </View>
        </View>
      ) : (
        <View className='content'>
          {/* Greeting card */}
          <View className='greeting-card'>
            <Text className='greeting-text'>{getGreeting()}</Text>
            <Text className='greeting-subtitle'>记下这一刻，理解可以慢慢来</Text>
            <View className='stats-row'>
              <View className='stat-item'>
                <Text className='stat-icon'>📝</Text>
                <Text className='stat-value'>{totalRecords} 条记录</Text>
              </View>
              <View className='stat-item'>
                <Text className='stat-icon'>👶</Text>
                <Text className='stat-value'>{children.length} 个孩子</Text>
              </View>
            </View>
          </View>

          {/* Recent photos gallery */}
          {recentPhotos.length > 0 && (
            <View className='section'>
              <Text className='section-title'>最近瞬间</Text>
              <ScrollView scrollX className='photo-gallery'>
                {recentPhotos.map(photo => (
                  <View
                    key={photo.id}
                    className='photo-item'
                    onClick={() => navigateToChild(photo.childId)}
                  >
                    <Image src={photo.imageUrl!} mode='aspectFill' className='photo-img' />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Quick record buttons */}
          <View className='section'>
            <Text className='section-title'>快速记录</Text>
            <View className='quick-actions'>
              <View className='action-card' onClick={() => navigateToRecord(children[0].id, 'text')}>
                <Text className='action-icon'>✏️</Text>
                <Text className='action-label'>文字记录</Text>
                <Text className='action-desc'>记录行为和语言</Text>
              </View>
              <View className='action-card' onClick={() => navigateToRecord(children[0].id, 'photo')}>
                <Text className='action-icon'>📸</Text>
                <Text className='action-label'>图文记录</Text>
                <Text className='action-desc'>拍照记录瞬间</Text>
              </View>
              <View className='action-card' onClick={() => navigateToRecord(children[0].id, 'voice')}>
                <Text className='action-icon'>🎤</Text>
                <Text className='action-label'>语音记录</Text>
                <Text className='action-desc'>语音转文字记录</Text>
              </View>
              <View className='action-card' onClick={() => navigateToRecord(children[0].id, 'text')}>
                <Text className='action-icon'>💭</Text>
                <Text className='action-label'>情绪记录</Text>
                <Text className='action-desc'>记录情绪表现</Text>
              </View>
            </View>
          </View>

          {/* Children list */}
          <View className='section'>
            <View className='section-header'>
              <Text className='section-title'>我的孩子</Text>
              <View className='add-btn' onClick={navigateToAddChild}>
                <Text className='add-btn-text'>+ 添加</Text>
              </View>
            </View>
            {children.map(child => {
              const ageInMonths = Math.floor(
                (Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
              )
              const latestRecord = child.records?.[0]
              const categoryIcons: Record<string, string> = {
                motor: '🏃', language: '🗣️', social: '👥', cognitive: '🧠', emotional: '❤️',
              }

              return (
                <View key={child.id} className='child-card' onClick={() => navigateToChild(child.id)}>
                  <View className='child-info'>
                    <View className='child-left'>
                      <Text className='child-name'>{child.name}</Text>
                      <Text className='child-age'>
                        {formatAge(ageInMonths)} · {child.gender === 'male' ? '男孩' : '女孩'}
                      </Text>
                    </View>
                    <View className='child-right'>
                      <Text className='child-count'>{child.records?.length || 0}</Text>
                      <Text className='child-count-label'>条记录</Text>
                    </View>
                  </View>
                  {latestRecord && (
                    <View className='latest-record'>
                      <Text className='latest-label'>最近记录</Text>
                      <View className='latest-content'>
                        <Text className='latest-icon'>
                          {categoryIcons[latestRecord.category] || '📝'}
                        </Text>
                        <Text className='latest-text'>{latestRecord.behavior}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        </View>
      )}
    </View>
  )
}
