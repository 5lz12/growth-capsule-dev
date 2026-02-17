/**
 * AI analyzer — stub implementation.
 *
 * Contract: analyze(record) → { analysis, source }
 *   analysis — flat object matching the stored DB schema
 *   source   — string identifier for this analyzer
 *
 * This module is pure computation — no DB access.
 *
 * TODO: Replace stub with real AI API call (e.g. cloud.openai or external HTTP).
 * The stub throws so that hybrid.js can fall back to local gracefully.
 */

/**
 * @param {object} record  The full record document from DB.
 * @returns {{ analysis: object, source: string }}
 */
async function analyze(record) {
  // Stub: not yet implemented. Callers (hybrid.js) should catch this and fall back.
  throw new Error('AI analyzer not yet implemented')
}

module.exports = { analyze }
