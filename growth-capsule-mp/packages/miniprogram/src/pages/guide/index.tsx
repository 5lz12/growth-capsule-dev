import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import './index.scss'

interface Milestone {
  label: string
  icon: string
  text: string
}

interface Stage {
  range: string
  title: string
  icon: string
  milestones: Milestone[]
  tip: string
}

const STAGES: Stage[] = [
  {
    range: '0-6个月',
    title: '新生儿期',
    icon: '👶',
    milestones: [
      { label: '运动', icon: '🏃', text: '抬头、翻身' },
      { label: '语言', icon: '🗣️', text: '发出咱咱声、对声音有反应' },
      { label: '社交', icon: '👥', text: '社会性微笑' },
      { label: '认知', icon: '🧠', text: '追视移动物体' },
      { label: '情感', icon: '❤️', text: '依恋关系建立' },
    ],
    tip: '这个阶段最重要的是建立安全依恋关系，及时回应宝宝的需求。',
  },
  {
    range: '6-12个月',
    title: '婴儿期',
    icon: '🧒',
    milestones: [
      { label: '运动', icon: '🏃', text: '坐、爬、站' },
      { label: '语言', icon: '🗣️', text: '模仿声音、叫“妈妈”“爸爸”' },
      { label: '社交', icon: '👥', text: '陌生人焦虑、分离焦虑' },
      { label: '认知', icon: '🧠', text: '客体永存概念' },
      { label: '情感', icon: '❤️', text: '安全依恋' },
    ],
    tip: '鼓励探索，保证安全环境。这是建立信任感和好奇心的关键期。',
  },
  {
    range: '1-2岁',
    title: '幼儿早期',
    icon: '🚶',
    milestones: [
      { label: '运动', icon: '🏃', text: '独立行走、跑步' },
      { label: '语言', icon: '🗣️', text: '词汇爆发期' },
      { label: '社交', icon: '👥', text: '平行游戏' },
      { label: '认知', icon: '🧠', text: '符号功能萌芽' },
      { label: '情感', icon: '❤️', text: '自主性发展' },
    ],
    tip: '允许孩子说“不”，这是自主意识发展的重要表现。提供选择而非命令。',
  },
  {
    range: '2-3岁',
    title: '幼儿期',
    icon: '🏃',
    milestones: [
      { label: '运动', icon: '🏃', text: '精细动作发展' },
      { label: '语言', icon: '🗣️', text: '简单句子' },
      { label: '社交', icon: '👥', text: '自我意识' },
      { label: '认知', icon: '🧠', text: '想象力丰富' },
      { label: '情感', icon: '❤️', text: '情绪调节初步' },
    ],
    tip: '这是“第一反抗期”，用共情代替说教，帮助孩子理解自己的情绪。',
  },
  {
    range: '3-6岁',
    title: '学龄前',
    icon: '🎨',
    milestones: [
      { label: '运动', icon: '🏃', text: '跳跃、骑车' },
      { label: '语言', icon: '🗣️', text: '复杂叙述' },
      { label: '社交', icon: '👥', text: '合作游戏' },
      { label: '认知', icon: '🧠', text: '前运算阶段' },
      { label: '情感', icon: '❤️', text: '主动性' },
    ],
    tip: '鼓励通过游戏学习，避免过早学业压力。社交技能和情绪管理比知识更重要。',
  },
  {
    range: '6-12岁',
    title: '学龄期',
    icon: '📖',
    milestones: [
      { label: '运动', icon: '🏃', text: '体育运动' },
      { label: '语言', icon: '🗣️', text: '阅读写作' },
      { label: '社交', icon: '👥', text: '同伴关系' },
      { label: '认知', icon: '🧠', text: '具体运算' },
      { label: '情感', icon: '❤️', text: '勤奋感' },
    ],
    tip: '关注孩子的学习体验而非成绩，帮助建立“我能行”的自信。避免横向比较。',
  },
]

const THEORIES = [
  {
    name: '皮亚杰 (Piaget)',
    desc: '认知发展四阶段理论：感知运动期→前运算期→具体运算期→形式运算期',
    color: 'purple',
  },
  {
    name: '埃里克森 (Erikson)',
    desc: '心理社会发展八阶段：信任vs不信任→自主vs羞耻→主动vs内疚→勤奋vs自卑...',
    color: 'blue',
  },
  {
    name: '维果茨基 (Vygotsky)',
    desc: '最近发展区理论：孩子在适当帮助下能达到的发展水平高于独立能力',
    color: 'green',
  },
  {
    name: '鲍尔比 (Bowlby)',
    desc: '依恋理论：安全依恋是儿童健康发展的基础',
    color: 'pink',
  },
]

export default function GuidePage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const toggleSection = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <View className='guide-page'>
      {/* Intro card */}
      <View className='intro-card'>
        <Text className='intro-title'>了解孩子的发展节奏</Text>
        <Text className='intro-text'>
          每个孩子都有自己的发展节奏。以下里程碑仅供参考，不同孩子达到的时间可能相差很大——这完全正常。
        </Text>
      </View>

      {/* Stage sections */}
      {STAGES.map((stage, index) => (
        <View key={index} className='stage-card'>
          <View className='stage-header' onClick={() => toggleSection(index)}>
            <View className='stage-header-left'>
              <Text className='stage-icon'>{stage.icon}</Text>
              <View className='stage-title-group'>
                <Text className='stage-title'>{stage.title}</Text>
                <Text className='stage-range'>{stage.range}</Text>
              </View>
            </View>
            <Text className={"stage-arrow " + (expandedIndex === index ? "expanded" : "")}>
              ▶
            </Text>
          </View>

          {expandedIndex === index && (
            <View className='stage-body'>
              {stage.milestones.map((m, mIdx) => (
                <View key={mIdx} className='milestone-item'>
                  <Text className='milestone-icon'>{m.icon}</Text>
                  <View className='milestone-info'>
                    <Text className='milestone-label'>{m.label}</Text>
                    <Text className='milestone-text'>{m.text}</Text>
                  </View>
                </View>
              ))}
              <View className='stage-tip'>
                <Text className='stage-tip-text'>
                  💡 {stage.tip}
                </Text>
              </View>
            </View>
          )}
        </View>
      ))}

      {/* Theoretical references */}
      <View className='theory-section'>
        <Text className='theory-section-title'>📚 理论基础</Text>
        {THEORIES.map((theory, idx) => (
          <View key={idx} className={"theory-card theory-" + theory.color}>
            <Text className='theory-name'>{theory.name}</Text>
            <Text className='theory-desc'>{theory.desc}</Text>
          </View>
        ))}
      </View>

      {/* Disclaimer */}
      <View className='disclaimer'>
        <Text className='disclaimer-text'>
          ⚠️ 以上发展里程碑基于群体统计数据，个体差异是正常的。如有担忧，建议咨询专业的儿童发展评估。
        </Text>
      </View>
    </View>
  )
}
