const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const { analyzeBehavior, getDevelopmentAdvice } = require('./lib/psychology')

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
  if (!recordId) {
    return { success: false, error: 'Missing recordId' }
  }

  let record
  try {
    const res = await db.collection('records').doc(recordId).get()
    record = res.data
  } catch (err) {
    console.error('analyzeRecord: failed to read record', recordId, err)
    return { success: false, error: 'Record not found' }
  }

  // Mark as analyzing
  try {
    await db.collection('records').doc(recordId).update({
      data: { analysisStatus: 'analyzing', updatedAt: db.serverDate() },
    })
  } catch (err) {
    console.error('analyzeRecord: failed to set analyzing status', err)
  }

  try {
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

    await db.collection('records').doc(recordId).update({
      data: {
        analysis: JSON.stringify(analysis),
        analysisStatus: 'done',
        updatedAt: db.serverDate(),
      },
    })

    return { success: true, data: analysis }
  } catch (err) {
    console.error('analyzeRecord: analysis failed', recordId, err)

    // Mark as failed
    try {
      await db.collection('records').doc(recordId).update({
        data: { analysisStatus: 'failed', updatedAt: db.serverDate() },
      })
    } catch (updateErr) {
      console.error('analyzeRecord: failed to set failed status', updateErr)
    }

    return { success: false, error: err.message || 'Analysis failed' }
  }
}
