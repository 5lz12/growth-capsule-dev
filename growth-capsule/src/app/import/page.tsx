'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Child {
  id: string
  name: string
  birthDate: string
  gender: string
}

interface TagGroup {
  tag: string
  count: number
  dateRange: {
    start: string
    end: string
  }
}

export default function ImportPage() {
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [selectedMappings, setSelectedMappings] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Load children
      const childrenRes = await fetch('/api/children')
      const childrenData = await childrenRes.json()
      setChildren(childrenData)

      // Load Day One exports
      const importsRes = await fetch('/api/import')
      const importsData = await importsRes.json()

      if (importsData.success) {
        setTagGroups(importsData.data.groupedByTag || [])
      } else {
        setMessage({ type: 'error', text: importsData.error || '无法加载导出的日记' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '加载失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  function handleMappingChange(tag: string, childId: string) {
    setSelectedMappings(prev => ({
      ...prev,
      [tag]: childId,
    }))
  }

  async function handleImport() {
    if (Object.keys(selectedMappings).length === 0) {
      setMessage({ type: 'error', text: '请至少选择一个映射关系' })
      return
    }

    setImporting(true)
    setMessage(null)

    try {
      const importPromises = Object.entries(selectedMappings).map(([tag, childId]) =>
        fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ childId, tagName: tag }),
        })
      )

      const results = await Promise.all(importPromises)

      let totalImported = 0
      let totalSkipped = 0
      let hasErrors = false

      for (const res of results) {
        const data = await res.json()
        if (data.success) {
          totalImported += data.data.imported
          totalSkipped += data.data.skipped
        } else {
          hasErrors = true
        }
      }

      if (hasErrors && totalImported === 0) {
        setMessage({ type: 'error', text: '导入失败，请重试' })
      } else {
        setMessage({
          type: 'success',
          text: `成功导入 ${totalImported} 条记录${totalSkipped > 0 ? `，跳过 ${totalSkipped} 条重复记录` : ''}`,
        })

        // Redirect after successful import
        setTimeout(() => {
          router.push('/profile')
        }, 2000)
      }
    } catch (error) {
      setMessage({ type: 'error', text: '导入失败，请重试' })
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/profile"
            className="text-blue-600 hover:text-blue-700"
          >
            ← 返回
          </Link>
          <h1 className="text-xl font-bold text-gray-800">导入日记</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">📥 导入 Day One 日记</h2>
          <p className="text-sm text-blue-700 leading-relaxed">
            从 Day One 导出的日记文件中自动识别日期、内容、标签等信息，
            并批量导入到成长时间胶囊中。请选择要将哪些标签的日记关联到哪个孩子。
          </p>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* 可用的孩子 */}
        {children.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="text-4xl mb-4">👶</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">还没有添加孩子</h3>
            <p className="text-gray-600 mb-4">请先添加一个孩子，然后再导入日记</p>
            <Link
              href="/children/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              添加孩子
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                家中的孩子 ({children.length})
              </h3>
              <div className="space-y-2">
                {children.map(child => (
                  <div
                    key={child.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-2xl">{child.gender === 'male' ? '👦' : '👧'}</span>
                    <span className="font-medium text-gray-800">{child.name}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(child.birthDate).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 日记标签映射 */}
            {tagGroups.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">没有找到日记文件</h3>
                <p className="text-gray-600">
                  请将 Day One 导出的日记文件放在指定目录中，然后刷新此页面
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  找到的日记标签 ({tagGroups.length})
                </h3>
                <div className="space-y-4">
                  {tagGroups.map(group => (
                    <div
                      key={group.tag}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">#{group.tag}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {group.count} 条记录 ·
                            {new Date(group.dateRange.start).toLocaleDateString('zh-CN')} 至{' '}
                            {new Date(group.dateRange.end).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          关联到孩子：
                        </label>
                        <select
                          value={selectedMappings[group.tag] || ''}
                          onChange={(e) => handleMappingChange(group.tag, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                          <option value="">-- 不导入 --</option>
                          {children.map(child => (
                            <option key={child.id} value={child.id}>
                              {child.name} ({child.gender === 'male' ? '男孩' : '女孩'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={importing || Object.keys(selectedMappings).length === 0}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                  importing || Object.keys(selectedMappings).length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {importing ? '导入中...' : `导入 ${Object.keys(selectedMappings).length} 个标签`}
              </button>
              <Link
                href="/profile"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </Link>
            </div>

            {/* 注意事项 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-900 mb-2">⚠️ 注意事项</h4>
              <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                <li>导入时会自动跳过重复的记录</li>
                <li>日记内容会自动识别行为类别（运动、语言、社交等）</li>
                <li>如果日记中有图片，需要手动重新上传</li>
                <li>导入后可以在孩子的详情页中查看所有记录</li>
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
