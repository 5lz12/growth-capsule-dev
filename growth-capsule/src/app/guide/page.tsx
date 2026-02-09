import Link from 'next/link'

const STAGES = [
  {
    range: '0-3个月',
    title: '新生儿期',
    icon: '👶',
    color: 'from-pink-50 to-rose-50',
    borderColor: 'border-pink-200',
    motor: ['反射性抓握', '头部可短暂抬起', '四肢无规则运动'],
    language: ['哭声表达需求', '对声音有反应', '开始发出咕咕声'],
    social: ['注视人脸', '对亲密抚养者有偏好', '被抱时安静'],
    cognitive: ['追踪移动物体', '对黑白对比图案感兴趣', '开始形成基本记忆'],
    emotional: ['通过哭泣表达不适', '对温暖接触有安慰反应', '开始社会性微笑'],
    tip: '这个阶段最重要的是建立安全依恋关系，及时回应宝宝的需求。',
  },
  {
    range: '3-6个月',
    title: '婴儿早期',
    icon: '🤒',
    color: 'from-orange-50 to-amber-50',
    borderColor: 'border-orange-200',
    motor: ['翻身（先仰卧转俯卧）', '抓握物品', '坐立需支撑'],
    language: ['咿呀学语', '模仿元音发音', '转头寻找声源'],
    social: ['社会性微笑增多', '对镜中自己感兴趣', '区分陌生人和熟人'],
    cognitive: ['手眼协调发展', '探索物品（放嘴里）', '因果关系初步理解'],
    emotional: ['表达愉悦和不满', '对熟悉面孔表现兴奋', '分离焦虑开始萌芽'],
    tip: '多进行面对面互动，回应宝宝的表情和声音，这是语言发展的基础。',
  },
  {
    range: '6-12个月',
    title: '婴儿晚期',
    icon: '🧒',
    color: 'from-yellow-50 to-lime-50',
    borderColor: 'border-yellow-200',
    motor: ['独坐稳定', '爬行', '扶站/扶走', '精细抓握（拇食指对捏）'],
    language: ['发出"妈妈""爸爸"等叠词', '理解简单指令', '用手指物表示需求'],
    social: ['陌生人焦虑明显', '模仿他人动作', '开始简单社交游戏（躲猫猫）'],
    cognitive: ['客体永存概念建立', '简单问题解决', '探索因果关系'],
    emotional: ['依恋关系巩固', '情绪表达更丰富', '开始有自我意识萌芽'],
    tip: '鼓励探索，保证安全环境。这是建立信任感和好奇心的关键期。',
  },
  {
    range: '1-2岁',
    title: '幼儿早期',
    icon: '🚶',
    color: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    motor: ['独立行走', '上下楼梯（扶手）', '涂鸦', '搭积木2-3块'],
    language: ['词汇量快速增长（50-200词）', '两词句出现', '能说出自己名字'],
    social: ['平行游戏', '开始表现占有欲', '模仿成人行为'],
    cognitive: ['符号功能发展（假装游戏）', '简单分类', '理解"多"和"少"'],
    emotional: ['自主性发展（"我自己来"）', '情绪波动大', '开始表达同理心'],
    tip: '允许孩子说"不"，这是自主意识发展的重要表现。提供选择而非命令。',
  },
  {
    range: '2-3岁',
    title: '幼儿晚期',
    icon: '🏃',
    color: 'from-teal-50 to-cyan-50',
    borderColor: 'border-teal-200',
    motor: ['跑跳稳定', '踢球', '穿脱简单衣物', '用勺子吃饭'],
    language: ['简单句（3-5词）', '提问"为什么"', '喜欢听故事'],
    social: ['开始合作游戏', '理解轮流', '有好朋友概念'],
    cognitive: ['颜色和形状辨别', '数到3-5', '时间概念萌芽（昨天/今天/明天）'],
    emotional: ['自我意识增强', '学习命名情绪', '想象力丰富（可能有想象中的朋友）'],
    tip: '这是"第一反抗期"，用共情代替说教，帮助孩子理解自己的情绪。',
  },
  {
    range: '3-6岁',
    title: '学龄前期',
    icon: '🎨',
    color: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    motor: ['单脚跳', '骑三轮车/滑板车', '使用剪刀', '画简单图形'],
    language: ['完整复杂句', '讲述故事', '认字兴趣', '理解幽默'],
    social: ['规则意识增强', '角色扮演游戏', '建立友谊', '理解他人感受'],
    cognitive: ['分类和排序', '数数到20+', '理解简单加减概念', '好奇心旺盛'],
    emotional: ['情绪调节能力增强', '自尊心发展', '恐惧和焦虑（怕黑、怕怪物）'],
    tip: '鼓励通过游戏学习，避免过早学业压力。社交技能和情绪管理比知识更重要。',
  },
  {
    range: '6-9岁',
    title: '学龄初期',
    icon: '📖',
    color: 'from-indigo-50 to-violet-50',
    borderColor: 'border-indigo-200',
    motor: ['精细运动成熟', '可以学习乐器/运动技能', '书写工整'],
    language: ['阅读理解发展', '表达越来越精确', '理解双关语和比喻'],
    social: ['同伴关系重要性增加', '团队合作', '理解规则和公平'],
    cognitive: ['逻辑思维发展', '分类和序列化', '时间和空间概念成熟'],
    emotional: ['勤奋vs自卑的发展危机', '自我评价受他人影响', '竞争意识增强'],
    tip: '关注孩子的学习体验而非成绩，帮助建立"我能行"的自信。避免横向比较。',
  },
  {
    range: '9-12岁',
    title: '学龄中期',
    icon: '🔬',
    color: 'from-violet-50 to-purple-50',
    borderColor: 'border-violet-200',
    motor: ['运动技能精熟', '可以参加竞技运动', '体力和耐力增强'],
    language: ['抽象语言理解', '议论文写作能力', '外语学习敏感期'],
    social: ['小团体（"圈子"）出现', '同伴认同重要', '开始质疑权威'],
    cognitive: ['抽象思维萌芽', '批判性思考', '元认知（思考自己的思考）'],
    emotional: ['青春期前期情绪变化', '自我认同探索', '隐私意识增强'],
    tip: '尊重孩子的隐私和独立性，同时保持开放的沟通渠道。倾听比说教更有效。',
  },
  {
    range: '12岁以上',
    title: '青少年期',
    icon: '🌟',
    color: 'from-purple-50 to-fuchsia-50',
    borderColor: 'border-purple-200',
    motor: ['身体快速发育', '运动能力接近成人', '身体形象关注增加'],
    language: ['成熟的语言表达', '辩证思维', '幽默和讽刺的运用'],
    social: ['同伴影响达到顶峰', '亲密关系探索', '社会角色认同'],
    cognitive: ['形式运算思维', '理想主义', '对社会问题的关注'],
    emotional: ['身份认同vs角色混乱', '情绪强烈且多变', '价值观形成'],
    tip: '做孩子的"安全基地"而非控制者。接纳他们的情绪波动，保持无条件的爱。',
  },
]

const DIMENSION_LABELS: Record<string, { label: string; icon: string }> = {
  motor: { label: '运动发展', icon: '🏃' },
  language: { label: '语言发展', icon: '🗣️' },
  social: { label: '社交能力', icon: '👥' },
  cognitive: { label: '认知发展', icon: '🧠' },
  emotional: { label: '情感发展', icon: '❤️' },
}

export default function GuidePage() {
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
            <h1 className="text-xl font-bold text-gray-800">成长阶段指南</h1>
            <p className="text-xs text-gray-500">Development Stage Guide</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-gradient-to-r from-brand-50 to-accent-50 border border-brand-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-brand-700 mb-2">了解孩子的发展节奏</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            每个孩子都有自己的发展节奏。以下里程碑仅供参考，不同孩子达到的时间可能相差很大——这完全正常。
            如果您有任何担忧，建议咨询专业的儿童发展评估。
          </p>
        </div>

        {/* 理论基础 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">📚 理论基础</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="font-semibold text-purple-800 mb-1">皮亚杰 (Piaget)</p>
              <p className="text-gray-700">认知发展四阶段理论：感知运动期→前运算期→具体运算期→形式运算期</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="font-semibold text-blue-800 mb-1">埃里克森 (Erikson)</p>
              <p className="text-gray-700">心理社会发展八阶段：信任vs不信任→自主vs羞耻→主动vs内疚→勤奋vs自卑...</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="font-semibold text-green-800 mb-1">维果茨基 (Vygotsky)</p>
              <p className="text-gray-700">最近发展区理论：孩子在适当帮助下能达到的发展水平高于独立能力</p>
            </div>
            <div className="bg-pink-50 rounded-xl p-4">
              <p className="font-semibold text-pink-800 mb-1">鲍尔比 (Bowlby)</p>
              <p className="text-gray-700">依恋理论：安全依恋是儿童健康发展的基础</p>
            </div>
          </div>
        </div>

        {/* 各阶段指南 */}
        {STAGES.map((stage, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${stage.color} rounded-2xl border ${stage.borderColor} p-6`}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{stage.icon}</span>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{stage.title}</h3>
                <p className="text-sm text-gray-600">{stage.range}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {(['motor', 'language', 'social', 'cognitive', 'emotional'] as const).map((dim) => {
                const info = DIMENSION_LABELS[dim]
                const items = stage[dim]
                return (
                  <div key={dim} className="bg-white/80 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      {info.icon} {info.label}
                    </p>
                    <ul className="space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className="text-xs text-gray-700 leading-relaxed">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            <div className="bg-white/60 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">💡 养育提示：</span>{stage.tip}
              </p>
            </div>
          </div>
        ))}

        {/* 底部提示 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-800 leading-relaxed">
            ⚠️ <strong>温馨提示：</strong>
            以上发展里程碑基于群体统计数据，个体差异是正常的。早期或晚期达到某个里程碑通常不代表问题。
            如果您对孩子的发展有持续的担忧，建议咨询儿科医生或儿童发展专家。
          </p>
        </div>
      </main>
    </div>
  )
}
