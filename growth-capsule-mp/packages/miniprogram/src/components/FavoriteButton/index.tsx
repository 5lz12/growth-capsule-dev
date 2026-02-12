import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { recordsApi } from '../../api/records'
import './index.scss'

interface FavoriteButtonProps {
  recordId: string
  initialIsFavorite?: boolean
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
}

export default function FavoriteButton({
  recordId,
  initialIsFavorite = false,
  size = 'medium',
  showText = false,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [loading, setLoading] = useState(false)

  const toggleFavorite = async () => {
    if (loading) return

    try {
      setLoading(true)
      const res = await recordsApi.toggleFavorite(recordId)
      if (res.success && res.data) {
        setIsFavorite(res.data.isFavorite)
        Taro.showToast({
          title: res.data.isFavorite ? '已收藏' : '已取消收藏',
          icon: 'success',
          duration: 1500,
        })
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const sizeClass = size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium'

  return (
    <View
      className={`favorite-button favorite-button-${sizeClass} ${isFavorite ? 'favorite-active' : ''}`}
      onClick={toggleFavorite}
    >
      <Text className={`favorite-icon ${isFavorite ? 'favorite-icon-active' : ''}`}>
        {isFavorite ? '⭐' : '☆'}
      </Text>
      {showText && (
        <Text className='favorite-text'>
          {isFavorite ? '已收藏' : '收藏'}
        </Text>
      )}
    </View>
  )
}
