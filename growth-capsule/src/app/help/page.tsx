import Link from 'next/link'

const FAQ = [
  {
    question: '记录的数据存储在哪里？',
    answer: '所有数据仅存储在您运行本应用的设备上（本地 SQLite 数据库），不会上传到任何第三方服务器。如果您配置了 AI 分析 API，行为描述文本会发送给对应的 AI 服务进行分析。',
  },
  {
    question: 'AI 分析的结果准确吗？',
    answer: 'AI 分析基于发展心理学理论提供参考性解读，不替代专业心理评估或医疗建议。每个孩子的发展节奏不同，请结合实际情况理解分析结果。分析结果标注了置信度（高/中/低），供您参考。',
  },
  {
    question: '不配置 AI API 也能使用吗？',
    answer: '可以。不配置 AI API 时，系统会使用内置的本地心理学规则引擎进行分析。本地分析基于经典发展心理学理论，虽然不如 AI 分析深入，但仍能提供有价值的参考。',
  },
  {
    question: '支持哪些 AI 服务？',
    answer: '支持所有 OpenAI 兼容格式的 API（DeepSeek、智谱GLM、通义千问、Moonshot、OpenAI）和 Anthropic 原生格式（Claude）。在 .env 文件中配置 API Key、Endpoint 和模型名称即可。',
  },
  {
    question: '如何导入已有的成长记录？',
    answer: '目前支持从 Day One 日记应用导入。前往"我的 → 导入日记"页面，上传 Day One 导出的 JSON 文件即可。导入后系统会自动为每条记录生成 AI 分析。',
  },
  {
    question: '照片支持哪些格式？',
    answer: '支持 JPEG、PNG、GIF、WebP 格式。同时支持 iPhone 的 HEIC/HEIF 格式——上传时会自动转换为 JPEG 格式。单张图片大小限制为 10MB。',
  },
  {
    question: '如何导出成长记录？',
    answer: '前往"我的 → 成长回忆册导出"页面，选择主题风格后可导出为 PDF 电子版（适合打印）或长图（适合社交媒体分享）。导出时可选择是否包含 AI 分析内容。',
  },
  {
    question: '行为类别是如何确定的？',
    answer: '在"文字记录"页面，系统会根据您输入的文字自动识别行为类别（运动、语言、社交、认知、情感）。您也可以在"拍照记录"页面手动选择类别。如果自动识别不准确，建议使用拍照记录模式手动选择。',
  },
  {
    question: '可以删除或修改记录吗？',
    answer: '可以。在孩子详情页的每条记录右上角有编辑和删除按钮。编辑记录后系统会重新生成 AI 分析。删除操作不可撤销，请谨慎操作。',
  },
  {
    question: '如何在手机上使用？',
    answer: '本应用采用响应式设计，在手机浏览器中直接访问即可。启动开发服务器后，同一局域网内的设备都可以通过 IP 地址访问。例如：http://192.168.1.100:3000',
  },
]

const USAGE_GUIDE = [
  {
    step: '1',
    title: '添加孩子',
    description: '点击首页"添加孩子"按钮，填写孩子的基本信息（姓名、出生日期、性别），可选上传头像。',
    icon: '👶',
  },
  {
    step: '2',
    title: '记录成长瞬间',
    description: '在孩子详情页点击"文字"或"拍照"按钮记录行为。自由描述即可，系统会自动识别类别并生成分析。',
    icon: '✏️',
  },
  {
    step: '3',
    title: '查看 AI 解读',
    description: '每条记录保存后会自动生成心理学视角的解读，包括发展阶段、心理学分析、情感共鸣和养育建议。',
    icon: '🧠',
  },
  {
    step: '4',
    title: '查看成长洞察',
    description: '在"洞察"页面查看多维度雷达图分析、发展趋势和阶段性总结，全面了解孩子的成长轨迹。',
    icon: '📊',
  },
  {
    step: '5',
    title: '导出回忆册',
    description: '在"我的"页面进入成长回忆册导出，选择主题风格，生成精美的 PDF 或长图与家人分享。',
    icon: '📸',
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/profile"
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">帮助与支持</h1>
            <p className="text-xs text-gray-500">Help & Support</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 使用指南 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📖 快速入门</h2>
          <div className="space-y-4">
            {USAGE_GUIDE.map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-lg">
                  {item.icon}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-gray-800 text-sm">
                    步骤 {item.step}：{item.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 常见问题 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">❓ 常见问题</h2>
          <div className="space-y-4">
            {FAQ.map((item, idx) => (
              <details key={idx} className="group">
                <summary className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-medium text-gray-800 pr-4">{item.question}</span>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-3 pb-3">
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">
                    {item.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* AI 配置说明 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🤖 AI 分析配置</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            在项目根目录的 <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env</code> 文件中配置以下环境变量：
          </p>
          <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
            <pre className="text-sm text-gray-300 leading-relaxed">
{`# DeepSeek 示例
AI_API_KEY=sk-xxx
AI_API_ENDPOINT=https://api.deepseek.com/v1/chat/completions
AI_MODEL=deepseek-chat

# 智谱 GLM 示例
AI_API_KEY=xxx.xxx
AI_API_ENDPOINT=https://open.bigmodel.cn/api/paas/v4/chat/completions
AI_MODEL=glm-4-flash

# Anthropic Claude 示例
AI_API_KEY=sk-ant-xxx
AI_API_ENDPOINT=https://api.anthropic.com/v1/messages
AI_MODEL=claude-sonnet-4-20250514`}
            </pre>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            系统会根据 endpoint URL 自动检测 API 格式。不配置则自动使用本地分析引擎。
          </p>
        </div>

        {/* 关于 */}
        <div className="bg-brand-50 rounded-2xl border border-brand-100 p-6">
          <h3 className="text-sm font-bold text-brand-700 mb-2">🌱 关于成长时间胶囊</h3>
          <p className="text-xs text-brand-700 leading-relaxed mb-3">
            成长时间胶囊是一个基于发展心理学的成长记录工具，帮助父母低负担记录孩子的成长瞬间，
            并通过 AI 将零散记录转化为结构化、可理解、可回顾的成长洞察。
          </p>
          <p className="text-xs text-brand-600">
            版本：v1.0 · 数据仅存储在本地 · 开源项目
          </p>
        </div>
      </main>
    </div>
  )
}
