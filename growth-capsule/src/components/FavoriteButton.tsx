'use client'

import { useState } from 'react'

interface FavoriteButtonProps {
  recordId: string
  initialIsFavorite: boolean
}

export function FavoriteButton({ recordId, initialIsFavorite }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isLoading, setIsLoading] = useState(false)

  const toggleFavorite = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/records/${recordId}/favorite`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setIsFavorite(data.data.isFavorite)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
      title={isFavorite ? '取消收藏' : '收藏到成长档案'}
    >
      {isFavorite ? (
        <svg className="w-5 h-5 text-brand-500 fill-current" viewBox="0 0 24 24">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )}
    </button>
  )
}
