import { useState, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useRouter, useLoad } from '@tarojs/taro'
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

export default function VoiceRecordPage() {
  const router = useRouter()
  const childId = router.params.childId as string

  const [child, setChild] = useState<Child | null>(null)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    loadChild()
    checkPermission()
  }, [])

  const loadChild = async () => {
    try {
      const res = await childrenApi.get(childId)
      if (res.success && res.data) {
        setChild(res.data)
      }
    } catch (error) {
      console.error('Failed to load child:', error)
    }
  }

  const checkPermission = async () => {
    try {
      const status = await Taro.getRecorderManager().authorize()
      setHasPermission(status === 'authorized')
    } catch (error) {
      console.error('Permission check failed:', error)
      setHasPermission(false)
    }
  }

  const requestPermission = async () => {
    try {
      const status = await Taro.getRecorderManager().authorize()
      if (status === 'authorized') {
        setHasPermission(true)
      } else {
        Taro.showModal({
          title: '需要权限',
          content: '请允许使用麦克风权限以进行语音记录',
          showCancel: false,
        })
      }
    } catch (error) {
      console.error('Request permission failed:', error)
    }
  }

  const startRecording = async () => {
    if (!hasPermission) {
      await requestPermission()
      return
    }

    try {
      setRecording(true)
      const recorderManager = Taro.getRecorderManager()

      const { tempFilePath } = await recorderManager.start({
        duration: 60000,
        format: 'mp3',
      })

      recorderManager.onStop((res) => {
        setRecording(false)
        if (res.tempFilePath) {
          transcribeAudio(res.tempFilePath)
        }
      })

      // Auto stop after 30 seconds
      setTimeout(() => {
        if (recording) {
          recorderManager.stop()
        }
      }, 30000)

    } catch (error) {
      console.error('Recording failed:', error)
      setRecording(false)
      Taro.showToast({
        title: '录音失败',
        icon: 'error',
      })
    }
  }

  const stopRecording = () => {
    const recorderManager = Taro.getRecorderManager()
    recorderManager.stop()
    setRecording(false)
  }

  const transcribeAudio = async (filePath: string) => {
    setTranscribing(true)

    try {
      // TODO: Implement actual transcription using WeChat or external API
      // For now, simulate with a placeholder
      await new Promise(resolve => setTimeout(resolve, 1500))

      setTranscript('（语音转文字功能开发中，请手动输入内容）')

      Taro.showToast({
        title: '转换完成',
        icon: 'success',
      })
    } catch (error) {
      console.error('Transcription failed:', error)
      Taro.showToast({
        title: '转换失败',
        icon: 'error',
      })
    } finally {
      setTranscribing(false)
    }
  }

  const calculateAge = (birthDate: string): number => {
    const months = Math.floor(
      (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    )
    return months
  }

  const handleSubmit = async () => {
    if (!transcript.trim()) {
      Taro.showToast({
        title: '请先录音或输入内容',
        icon: 'none',
      })
      return
    }

    if (!child) return

    try {
      const ageInMonths = calculateAge(child.birthDate)

      const res = await recordsApi.create(childId, {
        category: 'language',
        behavior: transcript.trim(),
        date: new Date().toISOString(),
        ageInMonths,
      })

      if (res.success) {
        Taro.showToast({
          title: '记录成功',
          icon: 'success',
          duration: 1500,
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
    }
  }

  const handleManualInput = () => {
    Taro.showModal({
      title: '手动输入',
      content: (
        <View>
          <Textarea
            placeholder='请输入语音内容...'
            onInput={(e) => setTranscript(e.detail.value)}
            style={{ height: '100px' }}
          />
        </View>
      ),
      confirmText: '确定',
      success: () => {
        // Modal content handles input
      },
    })
  }

  if (!child) {
    return (
      <View className='voice-record-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='voice-record-page'>
      {/* Header */}
      <View className='voice-header'>
        <Text className='header-title'>语音记录</Text>
        <Text className='header-subtitle'>语音转文字，自动记录</Text>
      </View>

      {!hasPermission ? (
        <View className='permission-container'>
          <Text className='permission-icon'>🎤</Text>
          <Text className='permission-title'>需要麦克风权限</Text>
          <Text className='permission-desc'>
            为了使用语音记录功能，需要访问您的麦克风
          </Text>
          <Button className='permission-btn' onClick={requestPermission}>
            授权麦克风
          </Button>
        </View>
      ) : (
        <View className='record-container'>
          {/* Child info */}
          <View className='child-info'>
            <Text className='child-name'>{child.name}</Text>
            <Text className='child-age'>
              {calculateAge(child.birthDate)}个月
            </Text>
          </View>

          {/* Recording area */}
          <View className='record-area'>
            <View
              className={`record-circle ${recording ? 'record-circle-active' : ''}`}
              onClick={recording ? stopRecording : startRecording}
            >
              <Text className={`record-icon ${recording ? 'record-icon-pulse' : ''}`}>
                {recording ? '⏹' : '🎤'}
              </Text>
              <Text className='record-status'>
                {recording ? '录音中...' : '点击开始录音'}
              </Text>
            </View>

            {recording && (
              <View className='recording-wave'>
                <View className='wave-bar' />
                <View className='wave-bar wave-delay-1' />
                <View className='wave-bar wave-delay-2' />
                <View className='wave-bar wave-delay-3' />
              </View>
            )}
          </View>

          {/* Transcript area */}
          <View className='transcript-area'>
            <Text className='transcript-label'>
              {transcribing ? '识别中...' : '识别结果'}
            </Text>
            <Text className='transcript-text'>
              {transcript || '暂无内容，点击下方按钮手动输入'}
            </Text>
            {!recording && !transcribing && (
              <View className='manual-btn' onClick={handleManualInput}>
                <Text>手动输入</Text>
              </View>
            )}
          </View>

          {/* Submit button */}
          <View className='submit-section'>
            <View
              className={`submit-btn ${!transcript.trim() || transcribing ? 'submit-btn-disabled' : ''}`}
              onClick={handleSubmit}
            >
              <Text className='submit-btn-text'>
                {transcribing ? '处理中...' : '保存记录'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
