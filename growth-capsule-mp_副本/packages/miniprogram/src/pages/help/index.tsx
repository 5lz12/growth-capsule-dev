import { View, Text, ScrollView } from '@tarojs/components'
import './index.scss'

const faqs = [
  {
    question: '如何添加孩子？',
    answer: '在首页点击"+添加孩子"按钮，填写孩子的姓名、出生日期和性别信息后保存即可。',
  },
  {
    question: '如何记录行为？',
    answer: '选择孩子后，可以通过"文字记录"、"图文记录"、"语音记录"三种方式记录孩子的行为。文字记录适合快速记录，图文记录可以拍照保存瞬间，语音记录可以自动转换语音为文字。',
  },
  {
    question: 'AI分析准不准确吗？',
    answer: 'AI分析基于发展心理学理论提供参考，可能存在误差。分析结果会标注置信度（高/中/低），建议结合实际情况理解。如发现明显错误，可以通过反馈功能帮助我们改进。',
  },
  {
    question: '数据可以导出吗？',
    answer: '是的，在"我的"页面可以找到"导出记录"功能，支持导出为PDF格式，方便保存和分享。',
  },
  {
    question: '如何收藏记录？',
    answer: '在记录详情页点击星标图标即可收藏。收藏的记录会在"我的"页面中单独展示。',
  },
  {
    question: '支持多孩子吗？',
    answer: '完全支持！您可以添加多个孩子，每个孩子的数据独立管理。在时光轴和洞察页面可以切换查看不同孩子的记录。',
  },
]

export default function HelpPage() {
  return (
    <View className='help-page'>
      <View className='help-header'>
        <Text className='help-title'>帮助中心</Text>
        <Text className='help-subtitle'>常见问题解答</Text>
      </View>

      <ScrollView scrollY className='help-content'>
        {faqs.map((faq, index) => (
          <View key={index} className='faq-item'>
            <View className='faq-question'>
              <Text className='question-text'>Q: {faq.question}</Text>
            </View>
            <View className='faq-answer'>
              <Text className='answer-text'>A: {faq.answer}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className='help-footer'>
        <Text className='footer-text'>更多帮助请联系客服</Text>
      </View>
    </View>
  )
}
