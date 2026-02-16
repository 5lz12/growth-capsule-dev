const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const { analyzeBehavior, getDevelopmentAdvice } = require('./lib/psychology')

const ANALYZE_TIMEOUT_MS = 25000
const MAX_RETRIES = 1

exports.main = async (event) => {
  const { action = 'analyzeRecord' } = event

  switch (action) {
    case 'analyzeRecord':
      return await analyzeRecord(event.recordId)
    default:
      return { success: false, error: 'Unknown action' }
  }
}

/**
 * Read a record from DB, run analysis, write results back.
 * Manages analysisStatus lifecycle: pending → analyzing → done | failed.
 */
async function analyzeRecord(recordId) {
  const startTime = Date.now()
  console.log(`[analyze] start recordId=${recordId} at=${new Date(startTime).toISOString()}`)

  if (!recordId) {
    console.log(`[analyze] abort: missing recordId, duration=${Date.now() - startTime}ms`)
    return { success: false, error: 'Missing recordId' }
  }

  let record
  try {
    const res = await db.collection('records').doc(recordId).get()
    record = res.data
    console.log(`[analyze] record loaded recordId=${recordId} category=${record.category} status=${record.analysisStatus} duration=${Date.now() - startTime}ms`)
  } catch (err) {
    const duration = Date.now() - startTime
    console.error(`[analyze] FAIL read record recordId=${recordId} duration=${duration}ms`, err)
    return { success: false, error: 'Record not found' }
  }

  // Guard: skip if already done (duplicate invocation)
  if (record.analysisStatus === 'done') {
    console.log(`[analyze] SKIP recordId=${recordId} — already done, duration=${Date.now() - startTime}ms`)
    return { success: true, data: record.analysis ? JSON.parse(record.analysis) : null }
  }

  // Mark as analyzing
  try {
    await db.collection('records').doc(recordId).update({
      data: { analysisStatus: 'analyzing', updatedAt: db.serverDate() },
    })
  } catch (err) {
    console.error(`[analyze] FAIL set analyzing status recordId=${recordId}`, err)
  }

  const isTimeoutError = (err) => err.message && err.message.includes('timed out')
  const currentRetryCount = record.retryCount || 0

  try {
    // Wrap analysis work in a timeout
    const analysisResult = await Promise.race([
      runAnalysis(record, recordId),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Analysis timed out after ${ANALYZE_TIMEOUT_MS}ms`)), ANALYZE_TIMEOUT_MS)
      ),
    ])

    const duration = Date.now() - startTime
    console.log(`[analyze] OK recordId=${recordId} duration=${duration}ms`)
    return analysisResult
  } catch (err) {
    const duration = Date.now() - startTime

    // Retry once on timeout if under the retry cap
    let lastError = err
    if (isTimeoutError(err) && currentRetryCount < MAX_RETRIES) {
      const newRetryCount = currentRetryCount + 1
      console.log(`[analyze] RETRY recordId=${recordId} retryCount=${newRetryCount} duration=${duration}ms`)

      try {
        await db.collection('records').doc(recordId).update({
          data: { retryCount: newRetryCount, analysisStatus: 'analyzing', updatedAt: db.serverDate() },
        })
      } catch (updateErr) {
        console.error(`[analyze] FAIL set retry status recordId=${recordId}`, updateErr)
      }

      try {
        const retryResult = await Promise.race([
          runAnalysis(record, recordId),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Analysis timed out after ${ANALYZE_TIMEOUT_MS}ms`)), ANALYZE_TIMEOUT_MS)
          ),
        ])

        const retryDuration = Date.now() - startTime
        console.log(`[analyze] OK (retry) recordId=${recordId} duration=${retryDuration}ms`)
        return retryResult
      } catch (retryErr) {
        lastError = retryErr
        const retryDuration = Date.now() - startTime
        console.error(`[analyze] FAIL (retry) recordId=${recordId} duration=${retryDuration}ms error=${retryErr.message}`, retryErr)
        // Fall through to mark as failed
      }
    } else {
      console.error(`[analyze] FAIL recordId=${recordId} duration=${duration}ms error=${err.message}`, err)
    }

    // Mark as failed
    try {
      await db.collection('records').doc(recordId).update({
        data: { analysisStatus: 'failed', updatedAt: db.serverDate() },
      })
    } catch (updateErr) {
      console.error(`[analyze] FAIL set failed status recordId=${recordId}`, updateErr)
    }

    return { success: false, error: lastError.message || 'Analysis failed' }
  }
}

/**
 * Core analysis logic — extracted so it can be wrapped with timeout.
 */
async function runAnalysis(record, recordId) {
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
    source: 'local',
  }

  // Conditional write: only update if status is still 'analyzing' (prevents stale overwrites)
  const { stats } = await db.collection('records')
    .where({ _id: recordId, analysisStatus: 'analyzing' })
    .update({
      data: {
        analysis: JSON.stringify(analysis),
        analysisStatus: 'done',
        updatedAt: db.serverDate(),
      },
    })

  if (stats.updated === 0) {
    console.log(`[analyze] SKIP write recordId=${recordId} — status no longer 'analyzing'`)
    return { success: false, error: 'Stale write skipped' }
  }

  return { success: true, data: analysis }
}
