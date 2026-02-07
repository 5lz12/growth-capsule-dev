'use client'

import { useState } from 'react'
import { formatAge } from '@/lib/utils'

interface ExportPreviewProps {
  child: any
  records: any[]
}

const THEMES = [
  {
    id: 'warm-sun',
    name: '暖阳',
    description: '温暖明亮，充满活力',
    gradient: 'from-orange-400 via-amber-300 to-yellow-200',
    icon: '☀️',
  },
  {
    id: 'starry-night',
    name: '星空',
    description: '梦幻宁静，充满想象',
    gradient: 'from-indigo-500 via-purple-500 to-pink-400',
    icon: '✨',
  },
  {
    id: 'forest',
    name: '森林',
    description: '自然清新，生机勃勃',
    gradient: 'from-green-400 via-emerald-400 to-teal-300',
    icon: '🌲',
  },
]

export function ExportPreview({ child, records }: ExportPreviewProps) {
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0])
  const [includeAnalysis, setIncludeAnalysis] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const ageInMonths = Math.floor(
    (Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  )

  const handleExportPDF = async () => {
    setIsExporting(true)
    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    alert('PDF 导出功能即将上线！')
    setIsExporting(false)
  }

  const handleExportImage = async () => {
    setIsExporting(true)
    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    alert('长图分享功能即将上线！')
    setIsExporting(false)
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
            {isExporting && (
              <div className="mt-3">
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            )}
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
