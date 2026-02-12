import { useState, useCallback } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { childrenApi, Child } from '../../api/children'
import './index.scss'

function formatAge(ageInMonths: number): string {
  const years = Math.floor(ageInMonths / 12)
  const months = ageInMonths % 12
  if (years === 0) return `${months}个月`
  if (months === 0) return `${years}岁`
  return `${years}岁${months}个月`
}

export default function ProfilePage() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const res = await childrenApi.list()
      if (res.success) {
        setChildren(res.data)
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    loadData()
  })

  if (loading) {
    return (
      <View className='profile-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  const allRecords = children.flatMap(child =>
    (child.records || []).map(r => ({ ...r, childName: child.name }))
  )
  const totalRecords = allRecords.length
  const favoriteCount = allRecords.filter(r => r.isFavorite).length
  const explorationThemes = new Set(allRecords.map(r => r.category)).size

  const navigateToChild = (childId: string) => {
    Taro.navigateTo({ url: `/pages/child-detail/index?id=${childId}` })
  }

  const menuItems = [
    {
      icon: '📚',
      title: '成长阶段指南',
      desc: '了解各年龄段的典型发展',
      url: '/pages/guide/index',
    },
    {
      icon: '❓',
      title: '帮助与支持',
      desc: '使用指南和常见问题',
      url: '/pages/help/index',
    },
  ]

  return (
    <View className='profile-page'>
      {/* Header card */}
      <View className='header-card'>
        <Text className='header-title'>
          {children.length === 0 ? '欢迎开始记录' : '继续陪伴成长'}
        </Text>
        <Text className='header-subtitle'>
          {children.length === 0
            ? '添加第一个孩子，开始记录珍贵的成长瞬间'
            : '每个孩子的成长都值得被看见和记录'}
        </Text>
      </View>

      {children.length === 0 ? (
        <View className='empty-state'>
          <Text className='empty-icon'>👶</Text>
          <Text className='empty-title'>开始记录成长时光</Text>
          <Text className='empty-desc'>添加第一个孩子，开始记录珍贵的成长瞬间</Text>
          <View className='empty-btn' onClick={() => Taro.navigateTo({ url: '/pages/add-child/index' })}>
            <Text className='empty-btn-text'>添加孩子</Text>
          </View>
        </View>
      ) : (
        <View className='content'>
          {/* Stats overview */}
          <View className='stats-card'>
            <Text className='stats-title'>📊 成长概览</Text>
            <View className='stats-grid'>
              <View className='stat-item'>
                <Text className='stat-value'>{children.length}</Text>
                <Text className='stat-label'>孩子</Text>
              </View>
              <View className='stat-item'>
                <Text className='stat-value'>{totalRecords}</Text>
                <Text className='stat-label'>成长瞬间</Text>
              </View>
              <View className='stat-item'>
                <Text className='stat-value'>{favoriteCount}</Text>
                <Text className='stat-label'>珍藏</Text>
              </View>
              <View className='stat-item'>
                <Text className='stat-value'>{explorationThemes}</Text>
                <Text className='stat-label'>探索领域</Text>
              </View>
            </View>
          </View>

          {/* Children list */}
          <View className='section'>
            <View className='section-header'>
              <Text className='section-title'>我的孩子</Text>
              <View
                className='add-child-btn'
                onClick={() => Taro.navigateTo({ url: '/pages/add-child/index' })}
              >
                <Text className='add-child-text'>+ 添加</Text>
              </View>
            </View>

            {children.map(child => {
              const ageInMonths = Math.floor(
                (Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
              )
              const recordCount = child.records?.length || 0
              const companionshipDays = Math.floor(
                (Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24)
              )
              const categoryCount = new Set((child.records || []).map(r => r.category)).size

              return (
                <View
                  key={child.id}
                  className='child-card'
                  onClick={() => navigateToChild(child.id)}
                >
                  <View className='child-top'>
                    <View className='child-avatar'>
                      {child.avatarUrl ? (
                        <Image src={child.avatarUrl} mode='aspectFill' className='avatar-img' />
                      ) : (
                        <Text className='avatar-emoji'>
                          {child.gender === 'male' ? '👦' : '👧'}
                        </Text>
                      )}
                    </View>
                    <View className='child-info'>
                      <Text className='child-name'>{child.name}</Text>
                      <Text className='child-age'>{formatAge(ageInMonths)}</Text>
                    </View>
                    <Text className='child-arrow'>→</Text>
                  </View>

                  <View className='child-stats'>
                    <View className='child-stat'>
                      <Text className='child-stat-value'>{recordCount}</Text>
                      <Text className='child-stat-label'>成长瞬间</Text>
                    </View>
                    <View className='child-stat accent'>
                      <Text className='child-stat-value'>{categoryCount}</Text>
                      <Text className='child-stat-label'>探索主题</Text>
                    </View>
                    <View className='child-stat pink'>
                      <Text className='child-stat-value'>{companionshipDays}</Text>
                      <Text className='child-stat-label'>陪伴天数</Text>
                    </View>
                  </View>

                  {child.records && child.records.length > 0 && (
                    <View className='child-latest'>
                      <Text className='latest-label'>最近记录</Text>
                      <Text className='latest-text'>{child.records[0].behavior}</Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>

          {/* Menu items */}
          <View className='section'>
            <Text className='section-title'>功能</Text>
            {menuItems.map((item, idx) => (
              <View
                key={idx}
                className='menu-item'
                onClick={() => Taro.navigateTo({ url: item.url })}
              >
                <Text className='menu-icon'>{item.icon}</Text>
                <View className='menu-info'>
                  <Text className='menu-title'>{item.title}</Text>
                  <Text className='menu-desc'>{item.desc}</Text>
                </View>
                <Text className='menu-arrow'>→</Text>
              </View>
            ))}
          </View>

          {/* About card */}
          <View className='about-card'>
            <Text className='about-title'>💡 关于成长时间胶囊</Text>
            <Text className='about-text'>
              成长时间胶囊是一个基于发展心理学的成长记录工具，帮助父母低负担记录孩子的成长瞬间，并通过 AI 将零散记录转化为结构化、可理解、可回顾的成长洞察。
            </Text>
            <View className='about-divider' />
            <Text className='about-version'>版本：v1.0</Text>
          </View>
        </View>
      )}
    </View>
  )
}
