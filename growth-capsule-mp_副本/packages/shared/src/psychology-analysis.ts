import { AnalysisRule } from './types'
import { formatAgeDescription } from './utils'

/**
 * 本地心理学分析规则引擎
 * 基于：皮亚杰认知发展理论、埃里克森心理社会发展理论、格塞尔发展量表等
 */
export const ANALYSIS_RULES: Partial<AnalysisRule>[] = [
  // 0-3 个月
  {
    ageRange: '0-3',
    category: 'motor',
    behaviorKey: '抬头',
    analysis: '颈部肌肉力量正在发展，这是早期运动控制的重要里程碑。俯卧时能抬头片刻表明躯干肌肉正在增强。',
    milestone: '大运动：俯卧抬头',
    importance: 'important'
  },
  {
    ageRange: '0-3',
    category: 'motor',
    behaviorKey: '抓握',
    analysis: '原始抓握反射正在逐渐转变为有意识的抓握。手眼协调能力开始萌芽，这是未来精细动作发展的基础。',
    milestone: '精细动作：手掌抓握反射',
    importance: 'critical'
  },
  {
    ageRange: '0-3',
    category: 'language',
    behaviorKey: '哭',
    analysis: '哭声是婴儿最早的沟通方式。不同的哭声可能表达不同的需求（饥饿、疼痛、需要安抚），这是语言发展的起点。',
    milestone: '语言前技能：通过哭声沟通',
    importance: 'important'
  },
  {
    ageRange: '0-3',
    category: 'social',
    behaviorKey: '注视',
    analysis: '开始注视人脸，表明视觉聚焦能力和社交兴趣正在发展。这是依恋关系建立的开始，对情感发展至关重要。',
    milestone: '社交：注视人脸，眼神交流',
    importance: 'critical'
  },
  {
    ageRange: '0-3',
    category: 'cognitive',
    behaviorKey: '声音',
    analysis: '对声音有反应，表明听觉系统正在正常工作，开始区分不同的声音刺激。这是语言理解和认知发展的基础。',
    milestone: '认知：对声音转头或停止活动',
    importance: 'important'
  },

  // 3-6 个月
  {
    ageRange: '3-6',
    category: 'motor',
    behaviorKey: '翻身',
    analysis: '翻身是躯干核心力量发展的重要标志，表明身体两侧协调能力正在提升。这个技能让婴儿能够主动探索周围环境。',
    milestone: '大运动：从仰卧翻到俯卧',
    importance: 'critical'
  },
  {
    ageRange: '3-6',
    category: 'motor',
    behaviorKey: '坐',
    analysis: '独坐需要背部肌肉力量和平衡感的发展。这个姿势让婴儿的视野和双手都得到解放，极大地促进了探索能力。',
    milestone: '大运动：支撑坐→独坐',
    importance: 'critical'
  },
  {
    ageRange: '3-6',
    category: 'language',
    behaviorKey: '咿呀',
    analysis: '咿呀学语是语言发展的重要阶段。婴儿开始练习发出不同的声音，为日后真正的语言输出做准备。多与婴儿对话可以促进这一发展。',
    milestone: '语言：咿呀学语，发出元音和辅音组合',
    importance: 'important'
  },
  {
    ageRange: '3-6',
    category: 'social',
    behaviorKey: '笑',
    analysis: '社交性微笑的出现表明婴儿开始识别熟悉的面孔，并对社交刺激做出积极回应。这是情感联结和信任感建立的重要标志。',
    milestone: '社交：对熟悉的人微笑',
    importance: 'critical'
  },
  {
    ageRange: '3-6',
    category: 'cognitive',
    behaviorKey: '玩具',
    analysis: '主动抓握并探索玩具表明手眼协调能力和物体永久性概念正在发展。这是认知能力提升的重要表现。',
    milestone: '认知：抓握并探索物体',
    importance: 'important'
  },

  // 6-12 个月
  {
    ageRange: '6-12',
    category: 'motor',
    behaviorKey: '爬',
    analysis: '爬行是全面的运动发展里程碑，同时发展了四肢协调、空间感知和平衡能力。研究发现爬行经验与日后阅读能力有一定关联。',
    milestone: '大运动：手膝爬行',
    importance: 'critical'
  },
  {
    ageRange: '6-12',
    category: 'motor',
    behaviorKey: '站',
    analysis: '扶站或独站表明腿部力量和平衡感显著提升。这是向独立行走过渡的关键阶段，标志着自主性正在增强。',
    milestone: '大运动：扶站→独站',
    importance: 'critical'
  },
  {
    ageRange: '6-12',
    category: 'language',
    behaviorKey: '叫',
    analysis: '能有意识地叫"爸爸""妈妈"或说出第一个词，标志着语言理解能力正在向表达能力转化。这是语言发展的重要转折点。',
    milestone: '语言：第一个有意义的词',
    importance: 'critical'
  },
  {
    ageRange: '6-12',
    category: 'social',
    behaviorKey: '陌生人',
    analysis: '认生/陌生人焦虑的出现表明婴儿已经能够区分熟悉和陌生的人，这是认知发展和依恋关系深化的正常表现。',
    milestone: '社交：陌生人焦虑',
    importance: 'normal'
  },
  {
    ageRange: '6-12',
    category: 'cognitive',
    behaviorKey: '躲猫猫',
    analysis: '喜欢躲猫猫游戏表明物体永久性概念正在形成——理解即使看不见，物体仍然存在。这是皮亚杰认知发展的重要里程碑。',
    milestone: '认知：理解物体永久性',
    importance: 'critical'
  },
  {
    ageRange: '6-12',
    category: 'emotional',
    behaviorKey: '分离',
    analysis: '分离焦虑的出现表明依恋关系已经建立，婴儿开始理解并在意与主要照顾者的分离。这是情感发展的正常阶段。',
    milestone: '情感：分离焦虑',
    importance: 'normal'
  },

  // 12-24 个月
  {
    ageRange: '12-24',
    category: 'motor',
    behaviorKey: '走',
    analysis: '独立行走极大地扩展了幼儿的探索范围，促进了空间认知、自主性和自信心的发展。这是婴儿期最重要的里程碑之一。',
    milestone: '大运动：独立行走',
    importance: 'critical'
  },
  {
    ageRange: '12-24',
    category: 'motor',
    behaviorKey: '跑',
    analysis: '从走到跑的变化表明平衡感、协调性和力量控制的进一步提升。幼儿开始探索更复杂的运动方式。',
    milestone: '大运动：跑步（可能不太稳）',
    importance: 'important'
  },
  {
    ageRange: '12-24',
    category: 'motor',
    behaviorKey: '吃',
    analysis: '开始尝试自己吃饭，使用勺子或手指食物，表明精细动作和自主性正在发展。这是自理能力的重要开端。',
    milestone: '精细动作：自主进食',
    importance: 'important'
  },
  {
    ageRange: '12-24',
    category: 'language',
    behaviorKey: '词',
    analysis: '词汇量快速增长的"词汇爆发期"。幼儿开始将词语与概念联系起来，并尝试组合词语表达更复杂的意思。',
    milestone: '语言：词汇量快速增长，开始说短语',
    importance: 'critical'
  },
  {
    ageRange: '12-24',
    category: 'cognitive',
    behaviorKey: '模仿',
    analysis: '延迟模仿能力（一段时间后模仿看到的行为）的出现表明记忆和符号表征能力正在发展。这是学习能力和想象力的基础。',
    milestone: '认知：延迟模仿能力',
    importance: 'important'
  },
  {
    ageRange: '12-24',
    category: 'emotional',
    behaviorKey: '自我',
    analysis: '开始说"我""我的"，表明自我意识正在萌芽。这是从"我们"到"我"的重要转变，标志着个体性发展的开始。',
    milestone: '情感：自我意识萌芽',
    importance: 'critical'
  },

  // 24-36 个月
  {
    ageRange: '24-36',
    category: 'motor',
    behaviorKey: '跳',
    analysis: '跳跃能力需要较强的下肢力量、平衡感和身体协调性。这表明大运动能力已经达到较为成熟的水平。',
    milestone: '大运动：双脚跳',
    importance: 'important'
  },
  {
    ageRange: '24-36',
    category: 'motor',
    behaviorKey: '画',
    analysis: '开始画画、搭积木，表明精细动作、手眼协调和创造性表达正在发展。这些活动同时促进认知和想象力发展。',
    milestone: '精细动作：画画、搭积木',
    importance: 'important'
  },
  {
    ageRange: '24-36',
    category: 'language',
    behaviorKey: '句子',
    analysis: '能够说出完整句子，开始理解和使用语法规则。这表明语言能力已经从词汇阶段进入到语法阶段，可以进行更复杂的表达。',
    milestone: '语言：说完整句子，使用语法',
    importance: 'critical'
  },
  {
    ageRange: '24-36',
    category: 'social',
    behaviorKey: '分享',
    analysis: '开始学习与他人分享和合作游戏，表明社交能力从平行游戏向合作游戏过渡。这是社会性发展的重要进步。',
    milestone: '社交：合作游戏，学习分享',
    importance: 'important'
  },
  {
    ageRange: '24-36',
    category: 'cognitive',
    behaviorKey: '问',
    analysis: '"为什么"阶段的出现表明好奇心和因果推理能力正在发展。幼儿开始试图理解世界运作的规律，这是科学思维的萌芽。',
    milestone: '认知：好奇提问，探索因果关系',
    importance: 'important'
  },
  {
    ageRange: '24-36',
    category: 'emotional',
    behaviorKey: '情绪',
    analysis: '开始识别和表达更复杂的情绪，学习情绪调节策略。这是情感智力发展的重要阶段，为日后的心理健康奠定基础。',
    milestone: '情感：情绪识别与调节',
    importance: 'important'
  },
]

/**
 * 根据行为描述和发展阶段自动分析
 */
export function analyzeBehavior(
  behavior: string,
  category: string,
  ageInMonths: number
): { analysis: string; milestone: string; importance: string } {
  const ageDesc = formatAgeDescription(ageInMonths)

  let ageRange = '0-3'
  if (ageInMonths > 36) ageRange = '36+'
  else if (ageInMonths > 24) ageRange = '24-36'
  else if (ageInMonths > 12) ageRange = '12-24'
  else if (ageInMonths > 6) ageRange = '6-12'
  else if (ageInMonths > 3) ageRange = '3-6'

  const matchedRules = ANALYSIS_RULES.filter(rule => {
    if (rule.ageRange !== ageRange) return false
    if (rule.category !== category) return false
    return rule.behaviorKey && (behavior.includes(rule.behaviorKey) || rule.behaviorKey.includes(behavior))
  })

  if (matchedRules.length > 0) {
    const rule = matchedRules[0]
    return {
      analysis: rule.analysis!,
      milestone: rule.milestone!,
      importance: rule.importance!,
    }
  }

  return {
    analysis: `记录了${ageDesc}在${category}方面的发展表现。持续观察并记录可以帮助了解孩子的发展轨迹。如果发现某方面发展滞后或超前，建议结合其他行为综合评估。`,
    milestone: '一般发展观察',
    importance: 'normal',
  }
}

/**
 * 获取发展建议
 */
export function getDevelopmentAdvice(
  category: string,
  ageInMonths: number
): string[] {
  const adviceMap: Record<string, string[]> = {
    motor: [
      '提供安全、宽敞的空间让孩子自由活动',
      '设置适合年龄的运动游戏和挑战',
      '避免过度保护，让孩子在安全范围内探索',
    ],
    language: [
      '多与孩子对话，描述日常活动和周围环境',
      '读书、讲故事，扩展词汇量和理解能力',
      '耐心倾听，鼓励孩子表达',
    ],
    social: [
      '安排与其他孩子的社交机会',
      '以身作则，示范良好的社交行为',
      '尊重孩子的社交节奏，不强迫',
    ],
    cognitive: [
      '提供丰富的探索材料和体验',
      '鼓励好奇心，认真回答孩子的问题',
      '允许孩子犯错，从错误中学习',
    ],
    emotional: [
      '接纳和命名孩子的情绪',
      '教授健康的情绪调节策略',
      '提供稳定、安全的情感支持',
    ],
  }

  return adviceMap[category] || ['持续观察，为孩子提供支持性的成长环境']
}
