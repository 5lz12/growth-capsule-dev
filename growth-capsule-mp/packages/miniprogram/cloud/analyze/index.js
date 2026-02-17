const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const { analyzeBehavior, getDevelopmentAdvice } = require('./lib/psychology')

const ANALYZE_TIMEOUT_MS = 25000
const MAX_RETRIES = 1

// Enable post-update invariant checks when METRICS_INVARIANT_CHECK=true is set
// in the cloud function's environment config, or when not running in production.
// Never throws — only logs structured errors.
const DEV_INVARIANT_CHECK =
  process.env.METRICS_INVARIANT_CHECK === 'true' ||
  (process.env.NODE_ENV !== undefined && process.env.NODE_ENV !== 'production')

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
    const duration = Date.now() - startTime
    console.log(`[analyze] SKIP recordId=${recordId} — already done, duration=${duration}ms`)
    recordMetrics({ totalCount: 1, skipCount: 1, totalDurationMs: duration })
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
    // Only count as success if the conditional write actually won (stats.updated === 1).
    // runAnalysis returns success:false with error:'Stale write skipped' when it loses.
    if (analysisResult.success) {
      recordMetrics({ totalCount: 1, successCount: 1, totalDurationMs: duration })
    }
    return analysisResult
  } catch (err) {
    const duration = Date.now() - startTime

    // Retry once on timeout if under the retry cap
    let lastError = err
    if (isTimeoutError(err) && currentRetryCount < MAX_RETRIES) {
      const newRetryCount = currentRetryCount + 1
      console.log(`[analyze] RETRY recordId=${recordId} retryCount=${newRetryCount} duration=${duration}ms`)
      recordMetrics({ timeoutCount: 1, retryCount: 1 })

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
        if (retryResult.success) {
          recordMetrics({ totalCount: 1, successCount: 1, retrySuccessCount: 1, totalDurationMs: retryDuration })
        }
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

    const failDuration = Date.now() - startTime
    recordMetrics({ totalCount: 1, failureCount: 1, totalDurationMs: failDuration })
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

  return {
    success: true,
    data: {
      milestone: { name: analysis.milestone, category: record.category },
      interpretation: {
        psychologicalInterpretation: analysis.psychologicalInterpretation,
        emotionalInterpretation: analysis.emotionalInterpretation,
      },
      parentingSuggestions: analysis.parentingSuggestions,
      confidenceLevel: analysis.confidenceLevel,
      source: analysis.source,
      // TODO remove in v2
      developmentStage: analysis.developmentStage,
      psychologicalInterpretation: analysis.psychologicalInterpretation,
      emotionalInterpretation: analysis.emotionalInterpretation,
    },
  }
}

/**
 * In dev mode: read analyze_metrics/global and assert totalCount === successCount + failureCount + skipCount.
 * Logs current totals and a structured error on violation. Never throws.
 */
async function checkMetricsInvariant() {
  try {
    const res = await db.collection('analyze_metrics').doc('global').get()
    const d = res.data
    const { totalCount = 0, successCount = 0, failureCount = 0, skipCount = 0 } = d
    const expected = successCount + failureCount + skipCount
    console.log(
      `[metrics:invariant] totalCount=${totalCount} successCount=${successCount} failureCount=${failureCount} skipCount=${skipCount} expected=${expected}`
    )
    if (totalCount !== expected) {
      console.error('[metrics:invariant] VIOLATION', JSON.stringify({
        totalCount,
        successCount,
        failureCount,
        skipCount,
        expected,
        delta: totalCount - expected,
      }))
    }
  } catch (err) {
    console.error('[metrics:invariant] FAIL read', err)
  }
}

/**
 * Fire-and-forget metrics recording to analyze_metrics/global.
 * Uses atomic inc() throughout. Upsert strategy:
 *   1. Try update() with _.inc() — succeeds if document exists.
 *   2. On "not exist" error, add() with zero-base counters + the current deltas.
 *   3. On duplicate-key error from add() (concurrent creator won the race),
 *      retry update() once — the document now exists and the inc() will land.
 * This ensures no invocation silently drops its increments.
 */
function recordMetrics(metrics) {
  const incData = {}
  for (const [key, value] of Object.entries(metrics)) {
    incData[key] = _.inc(value)
  }
  incData.updatedAt = db.serverDate()

  db.collection('analyze_metrics').doc('global').update({
    data: incData,
  }).then(() => {
    if (DEV_INVARIANT_CHECK) checkMetricsInvariant()
  }).catch((err) => {
    const isNotExist = err.errCode === -1 || (err.message && err.message.includes('not exist'))
    if (!isNotExist) {
      console.error('[metrics] FAIL update', err)
      return
    }

    // Document does not exist yet — try to create it with zero-base + current deltas.
    const initial = {
      _id: 'global',
      totalCount: 0, successCount: 0, failureCount: 0,
      timeoutCount: 0, retryCount: 0, retrySuccessCount: 0,
      skipCount: 0, totalDurationMs: 0,
    }
    for (const [key, value] of Object.entries(metrics)) {
      initial[key] = (initial[key] || 0) + value
    }
    initial.updatedAt = db.serverDate()

    db.collection('analyze_metrics').add({ data: initial }).then(() => {
      if (DEV_INVARIANT_CHECK) checkMetricsInvariant()
    }).catch((addErr) => {
      // A concurrent invocation already created the document.
      // Retry the update() — the document now exists, so _.inc() will land.
      const isDuplicate = addErr.errCode === -1 || (addErr.message && addErr.message.includes('already exist'))
      if (isDuplicate) {
        db.collection('analyze_metrics').doc('global').update({
          data: incData,
        }).then(() => {
          if (DEV_INVARIANT_CHECK) checkMetricsInvariant()
        }).catch(retryErr => console.error('[metrics] FAIL update (retry)', retryErr))
      } else {
        console.error('[metrics] FAIL create', addErr)
      }
    })
  })
}
