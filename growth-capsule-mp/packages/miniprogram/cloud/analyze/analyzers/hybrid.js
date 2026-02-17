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
 *      - ai.js handles its own retries internally (exponential backoff).
 *      - hybrid.js does NOT duplicate retry logic.
 *   3. If AI succeeds, merge: keep local structure but overlay AI fields.
 *   4. If AI throws a non-retryable error (4xx, parse, schema, not configured):
 *      fall back immediately — no further retry.
 *   5. If AI throws a retryable error (timeout, network, 5xx) but exhausted
 *      its own retries: fall back to local.
 */

const localAnalyzer = require('./local')
const aiAnalyzer    = require('./ai')

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
    // ai.js throws AiError objects with { type, retryable }.
    // Immediate fallback on non-retryable errors (4xx, parse, schema, missing config).
    // Fallback after retry exhaustion on retryable errors (already retried inside ai.js).
    const errorType = err.type || 'unknown'
    console.log('[ai]', JSON.stringify({
      stage: 'hybrid_fallback',
      error_type: errorType,
      retryable: err.retryable || false,
      message: err.message,
    }))
    aiAnalyzer._metrics.ai_fallback = (aiAnalyzer._metrics.ai_fallback || 0) + 1
    console.log('[ai:metrics]', JSON.stringify(aiAnalyzer._metrics))
    return { analysis: localAnalysis, source: 'local' }
  }
}

module.exports = { analyze }
