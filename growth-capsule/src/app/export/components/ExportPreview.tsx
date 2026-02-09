'use client'

import { useState, useRef } from 'react'
import { formatAge } from '@/lib/utils'

interface ExportPreviewProps {
  child: any
  records: any[]
}

const CATEGORY_ICONS: Record<string, string> = {
  motor: '🏃',
  language: '🗣️',
  social: '👥',
  cognitive: '🧠',
  emotional: '❤️',
}

const CATEGORY_LABELS: Record<string, string> = {
  motor: '运动发展',
  language: '语言发展',
  social: '社交能力',
  cognitive: '认知发展',
  emotional: '情感发展',
}

const THEMES = [
  {
    id: 'warm-sun',
    name: '暖阳',
    description: '温暖明亮，充满活力',
    gradient: 'from-orange-400 via-amber-300 to-yellow-200',
    bgColor: '#F97316',
    icon: '☀️',
  },
  {
    id: 'starry-night',
    name: '星空',
    description: '梦幻宁静，充满想象',
    gradient: 'from-indigo-500 via-purple-500 to-pink-400',
    bgColor: '#6366F1',
    icon: '✨',
  },
  {
    id: 'forest',
    name: '森林',
    description: '自然清新，生机勃勃',
    gradient: 'from-green-400 via-emerald-400 to-teal-300',
    bgColor: '#10B981',
    icon: '🌲',
  },
]

export function ExportPreview({ child, records }: ExportPreviewProps) {
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0])
  const [includeAnalysis, setIncludeAnalysis] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState('')
  const exportContentRef = useRef<HTMLDivElement>(null)

  const ageInMonths = Math.floor(
    (Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  )

  const buildExportContent = () => {
    let analysis: any = null
    return records.map((record) => {
      try {
        analysis = record.analysis ? JSON.parse(record.analysis) : null
      } catch {
        analysis = null
      }
      return { ...record, parsedAnalysis: analysis }
    })
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    setExportProgress('正在准备导出内容...')

    try {
      const { default: html2canvas } = await import('html2canvas')
      const { default: jsPDF } = await import('jspdf')

      // Build a temporary export container
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.width = '800px'
      container.style.background = 'white'
      container.style.padding = '40px'
      container.style.fontFamily = 'system-ui, -apple-system, sans-serif'

      const exportRecords = buildExportContent()

      container.innerHTML = buildExportHTML(exportRecords, 'pdf')
      document.body.appendChild(container)

      // Wait for all images to load before rendering
      setExportProgress('正在加载图片...')
      const images = container.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) return resolve()
              img.onload = () => resolve()
              img.onerror = () => resolve()
            })
        )
      )

      setExportProgress('正在生成 PDF...')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210
      const pageHeight = 297
      const margin = 10

      // Render cover page
      const coverEl = container.querySelector('#export-cover') as HTMLElement
      if (coverEl) {
        const coverCanvas = await html2canvas(coverEl, { scale: 2, useCORS: true })
        const coverImgData = coverCanvas.toDataURL('image/jpeg', 0.95)
        const coverRatio = coverCanvas.height / coverCanvas.width
        const coverW = pageWidth
        const coverH = coverW * coverRatio
        pdf.addImage(coverImgData, 'JPEG', 0, 0, coverW, Math.min(coverH, pageHeight))
      }

      // Render each record as a page
      const recordEls = container.querySelectorAll('.export-record')
      for (let i = 0; i < recordEls.length; i++) {
        setExportProgress(`正在处理第 ${i + 1}/${recordEls.length} 条记录...`)
        pdf.addPage()
        const el = recordEls[i] as HTMLElement
        const canvas = await html2canvas(el, { scale: 2, useCORS: true })
        const imgData = canvas.toDataURL('image/jpeg', 0.9)
        const ratio = canvas.height / canvas.width
        const imgW = pageWidth - margin * 2
        const imgH = imgW * ratio

        if (imgH <= pageHeight - margin * 2) {
          pdf.addImage(imgData, 'JPEG', margin, margin, imgW, imgH)
        } else {
          // Split across pages
          const totalHeight = imgH
          let yOffset = 0
          const usableH = pageHeight - margin * 2
          while (yOffset < totalHeight) {
            if (yOffset > 0) pdf.addPage()
            // Clip by rendering full image offset
            const srcY = (yOffset / imgH) * canvas.height
            const srcH = (usableH / imgH) * canvas.height
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = canvas.width
            tempCanvas.height = Math.min(srcH, canvas.height - srcY)
            const ctx = tempCanvas.getContext('2d')
            ctx?.drawImage(canvas, 0, srcY, canvas.width, tempCanvas.height, 0, 0, canvas.width, tempCanvas.height)
            const partData = tempCanvas.toDataURL('image/jpeg', 0.9)
            const partH = (tempCanvas.height / canvas.width) * imgW
            pdf.addImage(partData, 'JPEG', margin, margin, imgW, partH)
            yOffset += usableH
          }
        }
      }

      document.body.removeChild(container)

      setExportProgress('正在下载...')
      pdf.save(`${child.name}_成长回忆册.pdf`)
    } catch (error) {
      console.error('PDF export error:', error)
      alert('PDF 导出失败，请重试')
    } finally {
      setIsExporting(false)
      setExportProgress('')
    }
  }

  const handleExportImage = async () => {
    setIsExporting(true)
    setExportProgress('正在生成长图...')

    try {
      const { default: html2canvas } = await import('html2canvas')

      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.width = '750px'
      container.style.background = 'white'
      container.style.fontFamily = 'system-ui, -apple-system, sans-serif'

      const exportRecords = buildExportContent()
      container.innerHTML = buildExportHTML(exportRecords, 'image')
      document.body.appendChild(container)

      // Wait for all images to load before rendering
      setExportProgress('正在加载图片...')
      const images = container.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) return resolve()
              img.onload = () => resolve()
              img.onerror = () => resolve()
            })
        )
      )

      setExportProgress('正在渲染图片...')

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })

      document.body.removeChild(container)

      setExportProgress('正在下载...')

      // Download as PNG
      const link = document.createElement('a')
      link.download = `${child.name}_成长回忆册.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Image export error:', error)
      alert('长图导出失败，请重试')
    } finally {
      setIsExporting(false)
      setExportProgress('')
    }
  }

  const buildExportHTML = (exportRecords: any[], mode: 'pdf' | 'image') => {
    const themeColors: Record<string, { bg: string; light: string }> = {
      'warm-sun': { bg: 'linear-gradient(135deg, #F97316, #FCD34D)', light: '#FFF7ED' },
      'starry-night': { bg: 'linear-gradient(135deg, #6366F1, #EC4899)', light: '#EEF2FF' },
      'forest': { bg: 'linear-gradient(135deg, #10B981, #2DD4BF)', light: '#ECFDF5' },
    }
    const colors = themeColors[selectedTheme.id] || themeColors['warm-sun']

    const coverHTML = `
      <div id="export-cover" style="
        background: ${colors.bg};
        color: white;
        padding: 60px 40px;
        text-align: center;
        ${mode === 'image' ? 'border-radius: 16px 16px 0 0;' : ''}
        min-height: ${mode === 'pdf' ? '1100px' : '400px'};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      ">
        <div style="font-size: 64px; margin-bottom: 24px;">${selectedTheme.icon}</div>
        <h1 style="font-size: 36px; font-weight: bold; margin: 0 0 8px;">${child.name}</h1>
        <p style="font-size: 20px; opacity: 0.9; margin: 0 0 40px;">的成长回忆册</p>
        <div style="opacity: 0.8; font-size: 14px; line-height: 2;">
          <p>${formatAge(ageInMonths)}</p>
          <p>${records.length} 个成长瞬间</p>
          <p>${new Date(child.birthDate).getFullYear()} - ${new Date().getFullYear()}</p>
        </div>
      </div>
    `

    const recordsHTML = exportRecords.map((record, idx) => {
      const dateStr = new Date(record.date).toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
      const catIcon = CATEGORY_ICONS[record.category] || '📝'
      const catLabel = CATEGORY_LABELS[record.category] || record.category

      let analysisHTML = ''
      if (includeAnalysis && record.parsedAnalysis) {
        const a = record.parsedAnalysis
        analysisHTML = `
          <div style="margin-top: 16px; padding: 16px; background: ${colors.light}; border-radius: 12px;">
            ${a.developmentStage ? `<p style="font-size: 12px; color: #6366F1; font-weight: 600; margin: 0 0 8px;">🧒 ${a.developmentStage}</p>` : ''}
            ${a.psychologicalInterpretation ? `
              <div style="margin-bottom: 12px;">
                <p style="font-size: 12px; color: #7C3AED; font-weight: 600; margin: 0 0 4px;">🧠 心理学视角</p>
                <p style="font-size: 13px; color: #374151; line-height: 1.6; margin: 0;">${a.psychologicalInterpretation}</p>
              </div>
            ` : ''}
            ${a.emotionalInterpretation ? `
              <div style="margin-bottom: 12px;">
                <p style="font-size: 12px; color: #DB2777; font-weight: 600; margin: 0 0 4px;">💗 情感共鸣</p>
                <p style="font-size: 13px; color: #374151; line-height: 1.6; margin: 0;">${a.emotionalInterpretation}</p>
              </div>
            ` : ''}
            ${a.parentingSuggestions?.length ? `
              <div>
                <p style="font-size: 12px; color: #4B5563; font-weight: 600; margin: 0 0 8px;">💡 养育建议</p>
                ${a.parentingSuggestions.map((s: any) => `
                  <p style="font-size: 13px; color: #374151; line-height: 1.6; margin: 0 0 4px;">• ${s.content}</p>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `
      } else if (includeAnalysis && record.analysis && !record.parsedAnalysis) {
        analysisHTML = `
          <div style="margin-top: 16px; padding: 16px; background: ${colors.light}; border-radius: 12px;">
            <p style="font-size: 13px; color: #374151; line-height: 1.6; margin: 0;">${record.analysis}</p>
          </div>
        `
      }

      // Build absolute image URL for html2canvas
      let imageHTML = ''
      if (record.imageUrl) {
        const absoluteUrl = record.imageUrl.startsWith('http')
          ? record.imageUrl
          : `${window.location.origin}${record.imageUrl}`
        imageHTML = `
          <div style="margin-bottom: 12px; text-align: center;">
            <img src="${absoluteUrl}" style="max-width: 100%; height: auto; border-radius: 12px; background: #F3F4F6;" crossorigin="anonymous" />
          </div>
        `
      }

      return `
        <div class="export-record" style="padding: 24px 40px; border-bottom: 1px solid #E5E7EB; background: white;">
          ${imageHTML}
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 20px;">${catIcon}</span>
            <span style="font-size: 12px; color: #6B7280; background: #F3F4F6; padding: 2px 10px; border-radius: 99px;">${catLabel}</span>
            <span style="font-size: 12px; color: #9CA3AF; margin-left: auto;">${dateStr} · ${formatAge(record.ageInMonths)}</span>
          </div>
          <p style="font-size: 15px; color: #1F2937; line-height: 1.7; margin: 8px 0;">${record.behavior}</p>
          ${record.milestones ? `<p style="font-size: 12px; color: #B45309; background: #FFFBEB; display: inline-block; padding: 2px 12px; border-radius: 99px; border: 1px solid #FDE68A;">🏆 ${record.milestones}</p>` : ''}
          ${record.notes ? `<p style="font-size: 13px; color: #6B7280; font-style: italic; margin: 8px 0 0;">备注：${record.notes}</p>` : ''}
          ${analysisHTML}
        </div>
      `
    }).join('')

    const footerHTML = `
      <div style="padding: 24px 40px; text-align: center; color: #9CA3AF; font-size: 12px; background: #F9FAFB; ${mode === 'image' ? 'border-radius: 0 0 16px 16px;' : ''}">
        <p style="margin: 0;">🌱 成长时间胶囊 · ${child.name}的成长记录</p>
        <p style="margin: 4px 0 0;">生成于 ${new Date().toLocaleDateString('zh-CN')}</p>
      </div>
    `

    return coverHTML + recordsHTML + footerHTML
  }

  return (
    <div className="space-y-6">
      {/* 主题选择 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">选择主题风格</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(theme)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedTheme.id === theme.id
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-full h-24 rounded-lg bg-gradient-to-r ${theme.gradient} mb-3 flex items-center justify-center text-4xl`}>
                {theme.icon}
              </div>
              <p className="font-semibold text-gray-800">{theme.name}</p>
              <p className="text-xs text-gray-500 mt-1">{theme.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 封面预览 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">封面预览</h2>
        <div className="aspect-[3/4] max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg">
          <div className={`w-full h-full bg-gradient-to-br ${selectedTheme.gradient} flex flex-col items-center justify-center p-8 text-white`}>
            <div className="text-6xl mb-6">{selectedTheme.icon}</div>
            <h3 className="text-3xl font-bold mb-2">{child.name}</h3>
            <p className="text-lg opacity-90 mb-8">的成长回忆册</p>
            <div className="space-y-2 text-center">
              <p className="text-sm opacity-80">{formatAge(ageInMonths)}</p>
              <p className="text-sm opacity-80">{records.length} 个成长瞬间</p>
              <p className="text-sm opacity-80">
                {new Date(child.birthDate).getFullYear()} - {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 导出选项 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">导出选项</h2>

        {/* AI 深度解读开关 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
          <div>
            <p className="font-medium text-gray-800">包含 AI 深度解读</p>
            <p className="text-xs text-gray-500 mt-1">
              导出文件中包含每条记录的心理学分析和养育建议
            </p>
          </div>
          <button
            onClick={() => setIncludeAnalysis(!includeAnalysis)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              includeAnalysis ? 'bg-brand-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                includeAnalysis ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* 导出进度 */}
        {isExporting && exportProgress && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-blue-800 font-medium">{exportProgress}</p>
            </div>
          </div>
        )}

        {/* 导出按钮 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PDF 电子版 */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-4xl mb-3">📄</div>
            <p className="font-semibold text-gray-800 mb-1">PDF 电子版</p>
            <p className="text-xs text-gray-500">
              适合阅读和打印
            </p>
          </button>

          {/* 长图分享 */}
          <button
            onClick={handleExportImage}
            disabled={isExporting}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-4xl mb-3">🖼️</div>
            <p className="font-semibold text-gray-800 mb-1">长图分享</p>
            <p className="text-xs text-gray-500">
              适合社交媒体分享
            </p>
          </button>

          {/* 实体画册订制 */}
          <div className="p-6 border-2 border-gray-200 rounded-xl opacity-60 text-center">
            <div className="text-4xl mb-3">📚</div>
            <p className="font-semibold text-gray-800 mb-1">实体画册订制</p>
            <p className="text-xs text-gray-500">
              即将上线
            </p>
          </div>
        </div>
      </div>

      {/* 内容统计 */}
      <div className="bg-gradient-to-br from-brand-50 to-accent-50 rounded-2xl border border-brand-100 p-6">
        <h3 className="text-lg font-bold text-brand-700 mb-4">📊 回忆册内容</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-brand-600">{records.length}</p>
            <p className="text-sm text-brand-600 mt-1">成长瞬间</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-brand-600">
              {records.filter(r => r.imageUrl).length}
            </p>
            <p className="text-sm text-brand-600 mt-1">照片</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-brand-600">
              {new Set(records.map(r => r.category)).size}
            </p>
            <p className="text-sm text-brand-600 mt-1">发展领域</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-brand-600">
              {Math.floor(
                (Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24)
              )}
            </p>
            <p className="text-sm text-brand-600 mt-1">陪伴天数</p>
          </div>
        </div>
      </div>

      {/* 温馨提示 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800 leading-relaxed">
          💡 <strong>提示：</strong>
          导出功能将根据您选择的主题和设置，生成专属的成长回忆册。
          导出过程可能需要几秒钟，请耐心等待。
        </p>
      </div>
    </div>
  )
}
