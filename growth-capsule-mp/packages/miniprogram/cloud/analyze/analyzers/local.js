/**
 * Local (rule-based) analyzer.
 *
 * Contract: analyze(record) → { analysis, source }
 *   analysis — flat object matching the stored DB schema
 *   source   — string identifier for this analyzer
 *
 * This module is pure computation — no DB access.
 */

const { analyzeBehavior, getDevelopmentAdvice } = require('../lib/psychology')

/**
 * @param {object} record  The full record document from DB.
 * @returns {{ analysis: object, source: string }}
 */
function analyze(record) {
  const result = analyzeBehavior(record.behavior, record.category, record.ageInMonths)
  const advice = getDevelopmentAdvice(record.category)

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
  }

  return { analysis, source: 'local' }
}

module.exports = { analyze }
