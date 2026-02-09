'use client'

import { useState } from 'react'

interface FeedbackButtonsProps {
  recordId: string
}

export function FeedbackButtons({ recordId }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'improve' | null>(null)

  const handleFeedback = (type: 'helpful' | 'improve') => {
    setFeedback(type)
    // Store feedback locally (could be sent to API in the future)
    try {
      const stored = JSON.parse(localStorage.getItem('analysis-feedback') || '{}')
      stored[recordId] = { type, timestamp: Date.now() }
      localStorage.setItem('analysis-feedback', JSON.stringify(stored))
    } catch {
      // localStorage not available
    }
  }

  if (feedback) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-gray-700 mb-2">
          {feedback === 'helpful' ? '感谢您的肯定！' : '感谢反馈，我们会继续优化！'}
        </p>
        <p className="text-sm text-gray-400">
          {feedback === 'helpful' ? '您的反馈帮助我们做得更好' : '我们会持续改进分析质量'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
      <p className="text-gray-700 mb-4">这个解读对你有启发吗？</p>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => handleFeedback('helpful')}
          className="flex items-center gap-2 px-6 py-3 bg-accent-50 hover:bg-accent-100 border border-accent-200 rounded-xl transition-colors"
        >
          <span className="text-2xl">👍</span>
          <span className="text-sm font-medium text-accent-700">有帮助</span>
        </button>
        <button
          onClick={() => handleFeedback('improve')}
          className="flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
        >
          <span className="text-2xl">👎</span>
          <span className="text-sm font-medium text-gray-700">需要改进</span>
        </button>
      </div>
    </div>
  )
}
