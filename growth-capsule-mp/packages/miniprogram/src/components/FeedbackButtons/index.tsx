import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface FeedbackButtonsProps {
  recordId: string
}

type FeedbackType = 'helpful' | 'notHelpful' | 'inaccurate'

export default function FeedbackButtons({ recordId }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<FeedbackType | null>(null)
  const [loading, setLoading] = useState(false)

  const submitFeedback = async (type: FeedbackType) => {
    if (feedback || loading) return

    try {
      setLoading(true)
      // TODO: 实现反馈API后启用
      // await request({
      //   url: '/api/feedback',
      //   method: 'POST',
      //   data: {
      //     recordId,
      //     type,
      //   },
      // })
      setFeedback(type)
      Taro.showToast({
        title: '感谢反馈！',
        icon: 'success',
        duration: 1500,
      })
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      Taro.showToast({
        title: '反馈失败',
        icon: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='feedback-buttons'>
      <Text className='feedback-title'>这个解读对您有帮助吗？</Text>

      <View className='feedback-options'>
        <View
          className={`feedback-option ${feedback === 'helpful' ? 'feedback-selected' : ''}`}
          onClick={() => submitFeedback('helpful')}
        >
          <Text className='feedback-icon'>👍</Text>
          <Text className='feedback-label'>有帮助</Text>
        </View>

        <View
          className={`feedback-option ${feedback === 'notHelpful' ? 'feedback-selected' : ''}`}
          onClick={() => submitFeedback('notHelpful')}
        >
          <Text className='feedback-icon'>🤔</Text>
          <Text className='feedback-label'>一般</Text>
        </View>

        <View
          className={`feedback-option ${feedback === 'inaccurate' ? 'feedback-selected' : ''}`}
          onClick={() => submitFeedback('inaccurate')}
        >
          <Text className='feedback-icon'>❌</Text>
          <Text className='feedback-label'>不准确</Text>
        </View>
      </View>

      {feedback && (
        <Text className='feedback-thanks'>感谢您的反馈，帮助我们持续改进！</Text>
      )}
    </View>
  )
}

export { FeedbackButtons }
