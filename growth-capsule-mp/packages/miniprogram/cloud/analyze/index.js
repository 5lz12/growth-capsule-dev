const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const { ANALYSIS_RULES, analyzeBehavior, getDevelopmentAdvice } = require('./lib/psychology')

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { behavior, category, ageInMonths, childName } = event

  if (!behavior || !category || ageInMonths === undefined) {
    return { success: false, error: 'Missing required fields: behavior, category, ageInMonths' }
  }

  try {
    const result = analyzeBehavior(behavior, category, ageInMonths)
    const advice = getDevelopmentAdvice(category, ageInMonths)

    const analysis = {
      developmentStage: result.milestone,
      psychologicalInterpretation: result.analysis,
      emotionalInterpretation: null,
      parentingSuggestions: advice.map((content, i) => ({
        type: i === 0 ? 'observe' : i === 1 ? 'guidance' : 'emotional',
        content,
        theoryReference: null,
        deepInsight: null,
      })),
      milestone: result.milestone,
      confidenceLevel: result.importance === 'critical' ? 'high' : result.importance === 'important' ? 'medium' : 'low',
      source: 'local',
    }

    return { success: true, data: analysis }
  } catch (err) {
    console.error('analyze error:', err)
    return { success: false, error: err.message || 'Analysis failed' }
  }
}
