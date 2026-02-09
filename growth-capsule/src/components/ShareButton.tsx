'use client'

import { useState } from 'react'

interface ShareButtonProps {
  text: string
  title?: string
}

export function ShareButton({ text, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    // Try Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || '成长深度解读',
          text,
          url: window.location.href,
        })
        return
      } catch (error) {
        // User cancelled or share failed, fall through to clipboard
        if ((error as Error).name === 'AbortError') return
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(`${title ? title + '\n\n' : ''}${text}\n\n${window.location.href}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Final fallback
      const textarea = document.createElement('textarea')
      textarea.value = `${title ? title + '\n\n' : ''}${text}\n\n${window.location.href}`
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
      title={copied ? '已复制' : '分享'}
    >
      {copied ? (
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )}
    </button>
  )
}
