'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BEHAVIOR_CATEGORIES } from '@/types'

interface VoiceRecordFormProps {
  childId: string
  childName: string
}

export function VoiceRecordForm({ childId, childName }: VoiceRecordFormProps) {
  const router = useRouter()
  const [finalTranscript, setFinalTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [duration, setDuration] = useState(0)
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null)
  const [speechSupported, setSpeechSupported] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Check speech recognition support on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
    }
  }, [])

  const suggestCategory = useCallback((text: string) => {
    const lowerText = text.toLowerCase()

    if (lowerText.match(/走|跑|跳|爬|站|坐|翻身|踢|抓|握|击剑|运动|球/)) {
      return 'motor'
    }
    if (lowerText.match(/说|叫|话|词|语言|读|念|讲|问|回答|聊/)) {
      return 'language'
    }
    if (lowerText.match(/朋友|分享|帮助|合作|玩伴|一起|交流|微笑|拥抱/)) {
      return 'social'
    }
    if (lowerText.match(/数|算|认识|思考|问题|为什么|颜色|形状|记忆|理解/)) {
      return 'cognitive'
    }
    if (lowerText.match(/哭|笑|开心|生气|害怕|难过|情绪|感受|害羞|兴奋/)) {
      return 'emotional'
    }

    return null
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音识别，请使用 Chrome 或 Safari')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let newFinal = ''
      let newInterim = ''

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          newFinal += result[0].transcript
        } else {
          newInterim += result[0].transcript
        }
      }

      setFinalTranscript(prev => {
        // Only append truly new final text
        // The Speech API returns all results from session start,
        // so we track what's already been finalized
        const fullText = newFinal
        const suggested = suggestCategory(fullText + newInterim)
        setSuggestedCategory(suggested)
        return fullText
      })
      setInterimTranscript(newInterim)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        alert('请允许麦克风权限以使用语音输入')
      }
      setIsListening(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    recognition.onend = () => {
      // Move any remaining interim to final on end
      setInterimTranscript('')
      setIsListening(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setDuration(0)

    // Start duration timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
  }, [suggestCategory])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
    setInterimTranscript('')
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const displayText = isEditing ? editText : finalTranscript
  const behavior = isEditing ? editText : finalTranscript

  const startEditing = () => {
    setEditText(finalTranscript)
    setIsEditing(true)
    // Stop listening if editing
    if (isListening) {
      stopListening()
    }
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    let fileToUse = file

    const isHEIC = file.type === 'image/heic' || file.type === 'image/heif' ||
                   file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')

    if (isHEIC) {
      try {
        setIsConverting(true)
        const heic2any = (await import('heic2any')).default
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9
        })
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
        const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
        fileToUse = new File([blob], newFileName, { type: 'image/jpeg' })
      } catch (error) {
        console.error('HEIC conversion failed:', error)
        alert('图片转换失败，请尝试使用其他格式的图片')
        setIsConverting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      } finally {
        setIsConverting(false)
      }
    }

    setImageFile(fileToUse)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(fileToUse)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!behavior.trim()) {
      alert('请先录音或输入文字')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      const finalCategory = suggestedCategory || 'cognitive'

      formData.append('category', finalCategory)
      formData.append('behavior', behavior)
      formData.append('date', date)
      formData.append('notes', notes)

      if (imageFile) {
        formData.append('image', imageFile)
      }

      const endpoint = imageFile
        ? `/api/children/${childId}/record-with-image`
        : `/api/children/${childId}/records`

      const response = await fetch(endpoint, {
        method: 'POST',
        body: imageFile ? formData : JSON.stringify({
          category: finalCategory,
          behavior,
          date,
          notes,
        }),
        headers: imageFile ? {} : {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to create record')
      }

      router.push(`/children/${childId}`)
      router.refresh()
    } catch (error) {
      console.error('Error creating record:', error)
      alert('保存失败，请重试')
      setIsSubmitting(false)
    }
  }

  const categoryInfo = suggestedCategory
    ? BEHAVIOR_CATEGORIES.find(c => c.value === suggestedCategory)
    : null

  const hasContent = behavior.trim().length > 0 || interimTranscript.length > 0

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6">
      {/* Transcription display area */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 min-h-[160px]">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => {
                setEditText(e.target.value)
                setSuggestedCategory(suggestCategory(e.target.value))
              }}
              className="w-full text-base text-gray-800 outline-none resize-none min-h-[120px]"
              placeholder="编辑转写文本..."
            />
          ) : hasContent ? (
            <div
              className="text-base leading-relaxed cursor-pointer"
              onClick={startEditing}
              title="点击编辑"
            >
              <span className="text-gray-800">{finalTranscript}</span>
              {interimTranscript && (
                <span className="text-gray-400">{interimTranscript}</span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[120px] text-gray-400">
              <p className="text-base">
                {speechSupported ? '点击下方麦克风开始录音' : '您的浏览器不支持语音识别'}
              </p>
              <p className="text-sm mt-1">
                {speechSupported ? '说话时文字会实时显示在这里' : '请使用 Chrome 或 Safari 浏览器'}
              </p>
            </div>
          )}

          {/* Category suggestion */}
          {categoryInfo && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-full">
              <span className="text-lg">{categoryInfo.icon}</span>
              <span className="text-sm text-brand-700">
                AI识别为：{categoryInfo.label}
              </span>
            </div>
          )}
        </div>

        {/* Edit toggle */}
        {hasContent && !isEditing && (
          <div className="px-6 pb-3">
            <button
              type="button"
              onClick={startEditing}
              className="text-sm text-gray-500 hover:text-brand-600 transition-colors"
            >
              点击文字区域编辑
            </button>
          </div>
        )}
        {isEditing && (
          <div className="px-6 pb-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFinalTranscript(editText)
                setIsEditing(false)
              }}
              className="text-sm text-brand-600 font-medium"
            >
              完成编辑
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-sm text-gray-500"
            >
              取消
            </button>
          </div>
        )}
      </div>

      {/* Microphone button area */}
      <div className="flex flex-col items-center mb-6">
        {/* Duration display */}
        {isListening && (
          <div className="text-sm text-gray-500 mb-3 font-mono">
            {formatDuration(duration)}
          </div>
        )}

        {/* Mic button with pulse animation */}
        <div className="relative">
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" style={{ margin: '-12px' }} />
              <div className="absolute inset-0 rounded-full bg-red-400 animate-pulse opacity-30" style={{ margin: '-6px' }} />
            </>
          )}
          <button
            type="button"
            onClick={toggleListening}
            disabled={!speechSupported}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isListening
                ? 'bg-red-500 text-white scale-110'
                : speechSupported
                  ? 'bg-brand-500 text-white hover:bg-brand-600 hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isListening ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-3">
          {isListening ? '正在录音，点击停止' : speechSupported ? '点击开始录音' : '浏览器不支持语音识别'}
        </p>
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="mb-6">
          <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
            <img
              src={imagePreview}
              alt="上传的图片"
              className="w-full max-h-96 object-contain"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* HEIC conversion indicator */}
      {isConverting && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-amber-800">
              <strong>正在转换 HEIC 图片...</strong> 请稍候
            </p>
          </div>
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            {/* Image button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif"
              onChange={handleImageSelect}
              className="hidden"
              id="voice-image-upload"
              disabled={isConverting}
            />
            <label
              htmlFor="voice-image-upload"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              title="添加图片"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </label>

            {/* Date picker */}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !behavior.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-medium hover:from-brand-600 hover:to-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? '存入中...' : '存入胶囊'}
          </button>
        </div>
      </div>

      {/* Optional notes section */}
      <details className="mt-4">
        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors">
          + 添加更多情境信息（可选）
        </summary>
        <div className="mt-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="例如：当时在客厅玩，持续了约10分钟，孩子很开心..."
            rows={3}
            className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none resize-none"
          />
        </div>
      </details>
    </form>
  )
}
