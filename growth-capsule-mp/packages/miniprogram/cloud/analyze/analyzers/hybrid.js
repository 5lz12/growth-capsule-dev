/**
 * Hybrid analyzer — runs local analysis first, then attempts AI enhancement.
 *
 * Contract: analyze(record) → { analysis, source }
 *   analysis — flat object matching the stored DB schema
 *   source   — 'hybrid' if AI enhanced, 'local' if AI was unavailable
 *
 * This module is pure computation — no DB access.
 *
 * Strategy:
 *   1. Always run local analyzer to get a guaranteed baseline result.
 *   2. Attempt AI analyzer to produce richer interpretations.
 *   3. If AI succeeds, merge: keep local structure but overlay AI fields.
 *   4. If AI throws (stub, network error, timeout), return local result unchanged.
 */

const localAnalyzer = require('./local')
const aiAnalyzer = require('./ai')

/**
 * @param {object} record  The full record document from DB.
 * @returns {{ analysis: object, source: string }}
 */
async function analyze(record) {
  const { analysis: localAnalysis } = localAnalyzer.analyze(record)

  try {
    const { analysis: aiAnalysis } = await aiAnalyzer.analyze(record)
    // Merge: AI fields overlay local baseline where present and non-null.
    const merged = {
      ...localAnalysis,
      ...(aiAnalysis.psychologicalInterpretation != null && {
        psychologicalInterpretation: aiAnalysis.psychologicalInterpretation,
      }),
      ...(aiAnalysis.emotionalInterpretation != null && {
        emotionalInterpretation: aiAnalysis.emotionalInterpretation,
      }),
      ...(aiAnalysis.parentingSuggestions != null && {
        parentingSuggestions: aiAnalysis.parentingSuggestions,
      }),
    }
    return { analysis: merged, source: 'hybrid' }
  } catch (err) {
    console.log(`[analyze:hybrid] AI unavailable (${err.message}), using local result`)
    return { analysis: localAnalysis, source: 'local' }
  }
}

module.exports = { analyze }
