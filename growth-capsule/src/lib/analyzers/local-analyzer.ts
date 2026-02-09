import { Analyzer, GrowthAnalysisInput, GrowthAnalysisOutput, ParentingSuggestion, SuggestionType, ConfidenceLevel } from './base'
import { formatAgeDescription } from '@/lib/utils'

/**
 * 本地心理学分析器（升级版）
 *
 * 设计原则：
 * 1. 克制性：不夸大解读，避免"必须干预"的心理暗示
 * 2. 区分建议类型：仅观察、情绪支持、适度引导
 * 3. 根据行为特征动态判断置信度
 * 4. 提供理论出处和深度洞察
 */
export class LocalAnalyzer implements Analyzer {
  name = 'local-analyzer'
  priority = 1 // 低优先级，作为 fallback
  available(): boolean {
    return true
  }

  async analyze(input: GrowthAnalysisInput): Promise<GrowthAnalysisOutput> {
    const { childAge, behavior, category } = input

    // 1. 判断置信度
    const confidenceLevel = this.assessConfidence(behavior, childAge)

    // 2. 生成心理解读（心理学视角）
    const psychologicalInterpretation = this.generateInterpretation(
      behavior,
      category,
      childAge,
      confidenceLevel
    )

    // 2.1 生成情感解读（面向父母的情绪共鸣）
    const emotionalInterpretation = this.generateEmotionalInterpretation(
      category,
      childAge,
      confidenceLevel
    )

    // 3. 生成养育建议（带类型、理论出处和深度洞察）
    const parentingSuggestions = this.generateDetailedSuggestions(
      behavior,
      category,
      childAge,
      confidenceLevel
    )

    // 4. 确定发展阶段
    const developmentStage = this.getDevelopmentStage(childAge)

    // 5. 确定里程碑
    const milestone = this.identifyMilestone(behavior, category, childAge)

    return {
      developmentStage,
      psychologicalInterpretation,
      emotionalInterpretation,
      parentingSuggestions,
      milestone,
      confidenceLevel,
      source: 'local',
    }
  }

  /**
   * 评估置信度
   */
  private assessConfidence(behavior: string, ageInMonths: number): ConfidenceLevel {
    const behaviorLength = behavior.length
    const milestoneKeywords = [
      '抬头', '翻身', '坐', '爬', '站', '走', '跑', '跳',
      '叫', '说', '词', '句子',
      '笑', '认生', '分享',
      '抓握', '模仿', '画',
      '躲猫猫', '为什么', '自我',
    ]

    const hasMilestoneKeyword = milestoneKeywords.some(kw => behavior.includes(kw))

    if (hasMilestoneKeyword && behaviorLength >= 5) {
      return 'high'
    }

    if (behaviorLength >= 10) {
      return 'medium'
    }

    if (behaviorLength >= 5) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * 生成心理解读（心理学视角）
   * - 克制性：不夸大，避免焦虑
   * - 低置信度时明确告知信息不足
   */
  private generateInterpretation(
    behavior: string,
    category: string,
    ageInMonths: number,
    confidenceLevel: ConfidenceLevel
  ): string {
    const ageDesc = formatAgeDescription(ageInMonths)

    if (confidenceLevel === 'low') {
      return `记录了 ${ageDesc} 在 ${this.getCategoryLabel(category)} 方面的表现。` +
        `当前记录信息较少，建议在后续观察中补充更多细节（如发生情境、持续时间、孩子反应等），` +
        `以便更准确地了解发展情况。`
    }

    // 基于 category 生成克制性解读，带有理论视角
    const interpretations: Record<string, string> = {
      motor: `从皮亚杰认知发展理论来看，运动能力的发展是儿童认知发展的基础。${ageDesc}的当前表现，` +
        `反映了身体控制能力的发展状态。皮亚杰指出，"动作思维"是幼儿早期思维的主要形式，` +
        `运动能力的发展直接推动着认知能力的发展。每个孩子的发展路径不同，重要的是提供安全的环境让孩子自由探索。`,

      language: `根据维果茨基的社会文化理论，语言发展本质上是一个社会互动的过程。${ageDesc}正在以自己的节奏积累语言经验。` +
        `维果茨基强调，成人通过"支架式"的语言输入和对话，可以推动孩子进入"最近发展区"。` +
        `持续的语言输入和交流是关键，但不必对特定时间点出现特定语言表现抱有过度期待。`,

      social: `从鲍尔比的依恋理论视角来看，早期社交能力的发展与孩子建立的依恋关系质量密切相关。${ageDesc}的当前表现，` +
        `是孩子与外界互动方式的一种体现。每个孩子都有不同的气质类型（如容易型、困难型、慢热型），` +
        `这会影响他们的社交反应。尊重孩子的社交节奏，不必过度干预，让孩子按照自己的方式逐步建立社交信心。`,

      cognitive: `根据皮亚杰的认知发展阶段理论，${this.getDevelopmentStage(ageInMonths)}正处于感知运动阶段或前运算阶段。` +
        `${ageDesc}正在通过不断的探索来构建对世界的认知图式。皮亚杰认为，` +
        `"认识来源于动作，知识来源于动作"，孩子通过主动的探索和试错来理解世界的运作规律。保持好奇心比达到特定里程碑更重要。`,

      emotional: `从埃里克森的心理社会发展理论来看，${ageDesc}正在完成特定的心理社会发展任务。` +
        `此时表现出的情绪特点，反映了孩子当前的情感表达和调节能力。接纳和理解比快速"纠正"更重要，` +
        `因为安全型的依恋关系是未来情感健康发展的基石。`,
    }

    return interpretations[category] || `${this.getDevelopmentStage(ageInMonths)}的孩子在 ${this.getCategoryLabel(category)} 方面的发展记录。`
  }

  /**
   * 生成情感解读
   * - 面向父母的情绪共鸣型解释
   * - 强调陪伴的价值，减少焦虑
   */
  private generateEmotionalInterpretation(
    category: string,
    ageInMonths: number,
    confidenceLevel: ConfidenceLevel
  ): string | undefined {
    if (confidenceLevel === 'low') {
      return undefined
    }

    const emotionalInterpretations: Record<string, string> = {
      motor: `看着孩子一步步探索和掌握新的运动能力，作为父母，那种既骄傲又略带不舍的复杂心情很正常。` +
        `每一次跌倒后重新站起，都在告诉我们：孩子的成长，就是在不断试错中完成的。` +
        `您的陪伴和守护，就是孩子最坚实的后盾。温尼科特曾说，"足够好的母亲"不必完美，只需要在孩子需要时在场。`,

      language: `当孩子第一次清晰表达自己的想法时，那种"被听见"和"被理解"的喜悦，会成为您和孩子之间珍贵的情感纽带。` +
        `语言不只是沟通工具，更是心与心连接的桥梁。丹尼尔·斯特恩的研究表明，` +
        `早期的"情感调谐"（affective attunement）体验会深刻影响孩子的人际关系模式。您每一次认真倾听，都在告诉孩子："你的声音很重要"。`,

      social: `看着孩子与他人建立联系，学会分享和合作，作为父母的您，可能会感到欣慰，也可能会有一丝失落——` +
        `孩子正在逐步走向更广阔的世界。这种复杂的情感正是父母之爱的真实写照。` +
        `请记住，无论孩子走多远，您的怀抱永远是他们的安全基地（secure base），这是他们探索世界的勇气来源。`,

      cognitive: `当孩子眼睛发亮地问"为什么"时，那份对世界的好奇和求知欲是如此珍贵。` +
        `作为父母，我们不需要知道所有答案，重要的是保持和孩子一起探索的热情。` +
        `皮亚杰曾说："每次你教孩子一个答案，你就剥夺了他自己发现的机会。"您愿意停下来陪孩子观察一只蚂蚁、一片落叶，` +
        `这种陪伴本身就是最好的教育。`,

      emotional: `孩子学会识别和表达情绪，这是情感发展的重要里程碑。有时候孩子会大哭、发脾气，这其实是他们在学习处理复杂情绪。` +
        `约翰·鲍尔比的依恋理论告诉我们：被允许充分表达情绪的孩子，长大后更具备情绪调节能力。` +
        `您能够平静地接纳孩子的情绪，不急于"制止"或"纠正"，这种情感上的包容，会让孩子感受到无条件的爱，` +
        `也会成为他们日后情绪调节能力的基石。`,
    }

    return emotionalInterpretations[category]
  }

  /**
   * 生成详细的养育建议（带理论出处和深度洞察）
   */
  private generateDetailedSuggestions(
    behavior: string,
    category: string,
    ageInMonths: number,
    confidenceLevel: ConfidenceLevel
  ): ParentingSuggestion[] {
    const suggestions: ParentingSuggestion[] = []

    // 低置信度：只建议观察
    if (confidenceLevel === 'low') {
      return [{
        type: 'observe',
        content: '建议持续观察孩子的日常表现，记录更多细节（如发生情境、持续时间、孩子反应、情绪状态等）',
        theoryReference: '基于格塞尔发展量表：发展评估需要充分的情境信息',
      }]
    }

    // 根据类别生成带理论出处的建议
    switch (category) {
      case 'motor':
        suggestions.push({
          type: 'observe',
          content: '提供安全、宽敞的空间让孩子自由活动和探索',
          theoryReference: '皮亚杰：动作思维是认知发展的基础',
          deepInsight: '当孩子探索运动能力时，他们不仅在锻炼肌肉，更在构建"空间感""身体图式"等认知基础。过度保护反而会剥夺重要的学习机会。',
        })
        if (ageInMonths > 6) {
          suggestions.push({
            type: 'guidance',
            content: '可以设置适合年龄的游戏和活动，但不强迫孩子参与',
            theoryReference: '维果茨基"最近发展区"理论：提供略高于现有水平的挑战',
            deepInsight: '观察孩子的兴趣，在他们刚能完成的任务上提供支持，这就是"支架式教学"在生活中的应用。',
          })
        }
        break

      case 'language':
        suggestions.push({
          type: 'emotional',
          content: '多与孩子对话，描述日常活动和周围环境，自然地扩展语言输入',
          theoryReference: '维果茨基社会文化理论：语言发展是社会互动的产物',
          deepInsight: '您不仅是在教孩子说话，更是在邀请他们进入"意义的世界"。当您为孩子描述正在做的事情时，您是在帮助他们建立"词汇"与"体验"的连接。',
        })
        suggestions.push({
          type: 'observe',
          content: '耐心倾听孩子的表达，给予积极的关注和回应',
          theoryReference: '丹尼尔·斯特恩：情感调谐是早期依恋形成的关键',
          deepInsight: '孩子表达时真正需要的不是立即纠正发音或语法，而是感受到"我被听见"。这种被理解的感觉是自信和安全感的重要来源。',
        })
        break

      case 'social':
        suggestions.push({
          type: 'observe',
          content: '尊重孩子的社交节奏，不强迫孩子参与社交活动',
          theoryReference: '托马斯与切斯气质理论：孩子生来就有不同的气质类型',
          deepInsight: '有些孩子天生是"慢热型"，需要在陌生情境中更多时间观察和准备。这不是"害羞"，而是谨慎和细致。强迫只会增加焦虑，耐心等待才是最好的支持。',
        })
        if (ageInMonths > 12) {
          suggestions.push({
            type: 'guidance',
            content: '可以安排与其他孩子接触的机会，但允许孩子以自己的方式参与',
            theoryReference: '布朗芬布伦纳生态系统理论：同伴关系是微系统的重要组成部分',
            deepInsight: '孩子观察其他孩子也是重要的社交学习。即使他们只是在一旁观看，也在吸收社交规则和互动模式。允许他们先观察，再参与。',
          })
        }
        break

      case 'cognitive':
        suggestions.push({
          type: 'observe',
          content: '提供丰富的探索材料和体验，允许孩子以自己的节奏探索',
          theoryReference: '蒙台梭利："吸收性心智"理论：儿童通过与环境互动自我构建',
          deepInsight: '当孩子专注探索时，他们在进行"工作"。这种专注力是未来学习能力的基石。打扰或过度指导反而会打断重要的认知整合过程。',
        })
        suggestions.push({
          type: 'emotional',
          content: '认真回答孩子的问题，鼓励好奇心，但不急于给出标准答案',
          theoryReference: '皮亚杰：儿童通过"不平衡"来建构新的认知图式',
          deepInsight: '当孩子问"为什么"时，最好的回应往往不是标准答案，而是反问"你怎么想？"这能保护他们的思维主动性和创造性，让他们体验到思考的乐趣。',
        })
        break

      case 'emotional':
        suggestions.push({
          type: 'emotional',
          content: '接纳和命名孩子的情绪，让孩子感受到理解和尊重',
          theoryReference: '约翰·戈特曼：情绪辅导的五个步骤',
          deepInsight: '当孩子情绪激动时，首先尝试"看见"和"命名"情绪："你现在感觉很挫败，是因为积木倒了对吗？"情绪被理解和命名后，强度往往会自然降低。',
        })
        suggestions.push({
          type: 'observe',
          content: '提供稳定、安全的情感环境，允许孩子体验和表达情绪',
          theoryReference: '鲍尔比依恋理论：安全型依恋是探索世界的安全基地',
          deepInsight: '允许孩子体验负面情绪并不意味着溺爱。相反，知道"即使我难过，父母也在场"的孩子，更能够自我安慰。这种安全感会内化为他们终身的情绪调节资源。',
        })
        break
    }

    // 添加一个通用的"无需过度干预"建议
    if (confidenceLevel === 'high') {
      suggestions.push({
        type: 'observe',
        content: '当前表现正常，无需特殊干预。保持观察，继续提供支持性的成长环境即可',
        theoryReference: '基于发展心理学的"常态发展"原则',
        deepInsight: '大部分时候，孩子的发展不需要我们"做什么"，只需要我们"在"——在场、观察、在需要时提供支持。过度介入反而可能干扰自然的成长节奏。',
      })
    }

    return suggestions
  }

  /**
   * 识别里程碑
   */
  private identifyMilestone(behavior: string, category: string, ageInMonths: number): string | undefined {
    const milestones: Record<string, Record<string, string>> = {
      motor: {
        '抬头': '大运动：俯卧抬头（2-3个月）',
        '翻身': '大运动：翻身（3-5个月）',
        '坐': '大运动：独坐（6-8个月）',
        '爬': '大运动：手膝爬行（7-10个月）',
        '站': '大运动：扶站/独站（9-12个月）',
        '走': '大运动：独立行走（11-15个月）',
        '跑': '大运动：跑步（18-24个月）',
        '跳': '大运动：双脚跳（24-36个月）',
      },
      language: {
        '咿呀': '语言：咿呀学语（3-6个月）',
        '叫': '语言：第一个有意义的词（10-14个月）',
        '词': '语言：词汇快速增长（18个月以上）',
        '句子': '语言：说完整句子（24-36个月）',
      },
      social: {
        '笑': '社交：社交性微笑（2-3个月）',
        '陌生人': '社交：陌生人焦虑（6-12个月）',
        '认生': '社交：陌生人焦虑（6-12个月）',
        '分享': '社交：合作游戏与分享（24个月以上）',
      },
      cognitive: {
        '躲猫猫': '认知：物体永久性（8-12个月）',
        '模仿': '认知：延迟模仿能力（12-18个月）',
        '问': '认知：因果探索（18-24个月）',
        '为什么': '认知：因果探索（2岁以上）',
      },
      emotional: {
        '分离': '情感：分离焦虑（8-18个月）',
        '自我': '情感：自我意识萌芽（18-24个月）',
        '情绪': '情感：情绪识别与调节（24个月以上）',
      },
    }

    const categoryMilestones = milestones[category]
    if (!categoryMilestones) return undefined

    for (const [key, milestone] of Object.entries(categoryMilestones)) {
      if (behavior.includes(key)) {
        return milestone
      }
    }

    return undefined
  }

  private getDevelopmentStage(ageInMonths: number): string {
    if (ageInMonths <= 3) return '新生儿期（0-3个月）'
    if (ageInMonths <= 6) return '婴儿早期（3-6个月）'
    if (ageInMonths <= 12) return '婴儿晚期（6-12个月）'
    if (ageInMonths <= 24) return '幼儿早期（12-24个月）'
    if (ageInMonths <= 36) return '幼儿晚期（24-36个月）'
    if (ageInMonths <= 72) return '学龄前期（3-6岁）'
    if (ageInMonths <= 108) return '学龄初期/小学低年级（6-9岁）'
    if (ageInMonths <= 144) return '学龄中期/小学高年级（9-12岁）'
    return '青少年期（12岁以上）'
  }

  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      motor: '运动发展',
      language: '语言发展',
      social: '社交能力',
      cognitive: '认知发展',
      emotional: '情感发展',
    }
    return labels[category] || category
  }
}
