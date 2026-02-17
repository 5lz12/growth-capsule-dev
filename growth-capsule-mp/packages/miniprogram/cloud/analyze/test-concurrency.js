/**
 * Local concurrency test for analyzeRecord cloud function.
 *
 * Runs without wx-server-sdk or any network access by replacing the DB layer
 * with an in-memory mock that faithfully reproduces:
 *   - conditional where().update() (only updates when status matches)
 *   - atomic _.inc() counters
 *   - serverDate()
 *   - upsert fallback for missing documents
 *
 * Usage:
 *   node test-concurrency.js
 *   node test-concurrency.js --timeout  # force every invocation to timeout (retry scenario)
 */

'use strict'

// ─── CLI flags ────────────────────────────────────────────────────────────────
const FORCE_TIMEOUT = process.argv.includes('--timeout')
const CONCURRENCY   = 10

// ─── In-memory database ───────────────────────────────────────────────────────

/**
 * Simulate Firestore-style atomic inc().
 * Stored as a plain sentinel object; applied during update().
 */
class IncSentinel {
  constructor(n) { this.n = n }
}

/**
 * Minimal in-process store.  All operations are synchronous under a
 * single-threaded event-loop, matching WeChat Cloud DB semantics.
 *
 * Locking note: Node.js is single-threaded so there is no true parallel
 * mutation — concurrent async functions interleave only at await points.
 * The conditional where().update() relies on this: it reads then writes
 * atomically within one microtask step, just as the real DB does.
 */
class MockCollection {
  constructor(name, store) {
    this.name  = name
    this.store = store        // shared Map<id, object>
    this._log  = []           // audit trail of every write
  }

  doc(id) {
    return new MockDocRef(id, this.name, this.store, this._log)
  }

  where(query) {
    return new MockWhereQuery(query, this.name, this.store, this._log)
  }

  add({ data }) {
    const id = data._id || `auto_${Date.now()}_${Math.random().toString(36).slice(2)}`
    if (this.store.has(id)) {
      return Promise.reject(Object.assign(new Error('Document already exists'), { errCode: -1 }))
    }
    this.store.set(id, { ...data, _id: id })
    this._log.push({ op: 'add', id, data: { ...data } })
    return Promise.resolve({ _id: id })
  }
}

class MockDocRef {
  constructor(id, collName, store, log) {
    this.id       = id
    this.collName = collName
    this.store    = store
    this.log      = log
  }

  get() {
    const doc = this.store.get(this.id)
    if (!doc) return Promise.reject(Object.assign(new Error('Document not found'), { errCode: -1 }))
    return Promise.resolve({ data: { ...doc } })
  }

  update({ data }) {
    if (!this.store.has(this.id)) {
      return Promise.reject(Object.assign(new Error('Document not exist'), { errCode: -1 }))
    }
    const doc = this.store.get(this.id)
    applyUpdate(doc, data)
    this.log.push({ op: 'update', coll: this.collName, id: this.id, data: { ...data } })
    return Promise.resolve({ stats: { updated: 1 } })
  }
}

class MockWhereQuery {
  constructor(query, collName, store, log) {
    this.query    = query
    this.collName = collName
    this.store    = store
    this.log      = log
  }

  update({ data }) {
    // Find all docs matching every field in query
    let updated = 0
    for (const [, doc] of this.store) {
      if (matchesQuery(doc, this.query)) {
        applyUpdate(doc, data)
        this.log.push({ op: 'where.update', coll: this.collName, query: this.query, docId: doc._id, data: { ...data } })
        updated++
      }
    }
    return Promise.resolve({ stats: { updated } })
  }
}

function matchesQuery(doc, query) {
  return Object.entries(query).every(([k, v]) => doc[k] === v)
}

function applyUpdate(doc, data) {
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof IncSentinel) {
      doc[key] = (doc[key] || 0) + value.n
    } else if (value && value.__serverDate) {
      doc[key] = new Date().toISOString()
    } else {
      doc[key] = value
    }
  }
}

// ─── wx-server-sdk mock ───────────────────────────────────────────────────────

const recordsStore = new Map()
const metricsStore = new Map()

// Collections keyed by name
const collections = {
  records:          new MockCollection('records', recordsStore),
  analyze_metrics:  new MockCollection('analyze_metrics', metricsStore),
}

const dbMock = {
  collection: (name) => {
    if (!collections[name]) throw new Error(`Unknown collection: ${name}`)
    return collections[name]
  },
  serverDate: () => ({ __serverDate: true }),
  command: {
    inc: (n) => new IncSentinel(n),
  },
}

// Declared here so the Module._load interceptor below can reference it
// before the timeout-injection section further down initializes it.
let _timeoutActive = false

// Inject mock before requiring the cloud function
const Module = require('module')
const _origLoad = Module._load.bind(Module)
Module._load = function (request, parent, isMain) {
  if (request === 'wx-server-sdk') {
    return {
      init: () => {},
      DYNAMIC_CURRENT_ENV: 'test',
      database: () => dbMock,
    }
  }
  return _origLoad(request, parent, isMain)
}

// Now require the cloud function (module cache miss forces fresh load)
delete require.cache[require.resolve('./index.js')]
delete require.cache[require.resolve('./lib/psychology.js')]
const { main } = require('./index.js')

// ─── Helpers ─────────────────────────────────────────────────────────────────

const COLORS = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  magenta:'\x1b[35m',
}
const c = (color, str) => `${COLORS[color]}${str}${COLORS.reset}`

let assertionsFailed = 0
function assert(cond, msg, detail = '') {
  if (cond) {
    console.log(`  ${c('green', '✓')} ${msg}`)
  } else {
    console.log(`  ${c('red', '✗')} ${msg}${detail ? `  — ${c('dim', detail)}` : ''}`)
    assertionsFailed++
  }
}

// ─── Invocation interceptor ───────────────────────────────────────────────────
// Wrap the conditional write in runAnalysis to track who wins.
//
// We patch MockWhereQuery.update directly on the prototype once so that
// every where().update() call is intercepted exactly once — no matter how
// many times collection('records').where() is called.

const writeWinners  = []   // write attempt indices where stats.updated === 1
const writeAttempts = []   // every where.update() attempt
let   invocationIdx = 0

const _origWhereUpdate = MockWhereQuery.prototype.update
MockWhereQuery.prototype.update = async function ({ data }) {
  // Only trace writes against the records collection
  if (this.collName !== 'records') return _origWhereUpdate.call(this, { data })

  // When timeout scenario is active: hang the conditional write so that
  // runAnalysis never resolves, causing the Promise.race timeout to fire.
  if (_timeoutActive) return new Promise(() => {})

  const myIdx = invocationIdx++
  const result = await _origWhereUpdate.call(this, { data })
  const won = result.stats.updated > 0
  writeAttempts.push({ idx: myIdx, won })
  if (won) writeWinners.push(myIdx)
  const tag = won ? c('green', `[INV-${myIdx} WON ✓]`) : c('dim', `[INV-${myIdx} lost]`)
  console.log(`  ${tag} where(${JSON.stringify(this.query)}).update → updated=${result.stats.updated}`)
  return result
}

// Remove the collection-level wrap that was here previously — tracing is now
// done via MockWhereQuery.prototype.update above.

// ─── Timeout injection ────────────────────────────────────────────────────────
// If --timeout flag is set, we need the ANALYZE_TIMEOUT_MS race() leg to win.
// The local psychology engine is synchronous, so it always beats any real timer.
//
// Strategy: when --timeout is active, the Module._load intercept returns a
// hanging analyzeBehavior stub for the psychology module, so runAnalysis never
// resolves.  We also collapse long setTimeouts to 1 ms so the test doesn't
// wait 25 s.  Both patches are scoped to the --timeout scenario.

let _origSetTimeout = global.setTimeout
// _timeoutActive declared earlier, before Module._load patch

function installTimeoutAccelerator() {
  _timeoutActive = true
  // Collapse the 25 s analysis guard to 1 ms so the test doesn't wait 25 s.
  // The MockWhereQuery.update intercept above will hang when _timeoutActive=true,
  // so runAnalysis never resolves and the timeout leg of Promise.race fires.
  global.setTimeout = function (fn, delay, ...args) {
    const effectiveDelay = (delay >= 1000) ? 1 : delay
    return _origSetTimeout(fn, effectiveDelay, ...args)
  }
}

function uninstallTimeoutAccelerator() {
  _timeoutActive = false
  global.setTimeout = _origSetTimeout
}

// ─── Test scenarios ───────────────────────────────────────────────────────────

async function runScenario(label, seedRecord) {
  console.log(`\n${'─'.repeat(70)}`)
  console.log(c('bold', `SCENARIO: ${label}`))
  console.log(`${'─'.repeat(70)}`)

  // Reset state
  recordsStore.clear()
  metricsStore.clear()
  writeWinners.length  = 0
  writeAttempts.length = 0
  invocationIdx        = 0
  collections.records._log.length = 0
  collections.analyze_metrics._log.length = 0

  // Seed the record
  const RECORD_ID = 'test-record-001'
  recordsStore.set(RECORD_ID, { _id: RECORD_ID, ...seedRecord })

  console.log(`\n${c('cyan', 'Seed record:')}`)
  console.log(`  ${JSON.stringify(recordsStore.get(RECORD_ID), null, 2).replace(/\n/g, '\n  ')}`)

  if (FORCE_TIMEOUT) {
    installTimeoutAccelerator()
    console.log(c('yellow', '\n  [--timeout] DB write stub installed — runAnalysis hangs, timeout fires in ~1ms'))
  }

  // ── Fire CONCURRENCY invocations simultaneously ──────────────────────────
  console.log(`\n${c('cyan', `Firing ${CONCURRENCY} concurrent analyzeRecord invocations...`)}`)
  const promises = Array.from({ length: CONCURRENCY }, (_, i) =>
    main({ action: 'analyzeRecord', recordId: RECORD_ID })
      .then(result => ({ i, result, error: null }))
      .catch(error => ({ i, result: null, error }))
  )
  const results = await Promise.all(promises)

  if (FORCE_TIMEOUT) {
    uninstallTimeoutAccelerator()
  }

  // ── Print individual results ─────────────────────────────────────────────
  console.log(`\n${c('cyan', 'Individual results:')}`)
  const successes = results.filter(r => r.result && r.result.success === true)
  const failures  = results.filter(r => r.result && r.result.success === false)
  const throws    = results.filter(r => r.error)

  for (const { i, result, error } of results) {
    if (error) {
      console.log(`  INV-${i}: ${c('red', 'THREW')} ${error.message}`)
    } else if (result.success) {
      console.log(`  INV-${i}: ${c('green', 'success')}  source=${result.data?.source ?? '?'}`)
    } else {
      console.log(`  INV-${i}: ${c('yellow', 'success=false')}  error="${result.error}"`)
    }
  }

  // ── Final DB state ───────────────────────────────────────────────────────
  const finalRecord  = recordsStore.get(RECORD_ID)
  const finalMetrics = metricsStore.get('global')

  console.log(`\n${c('cyan', 'Final record state:')}`)
  console.log(`  _id            : ${finalRecord._id}`)
  console.log(`  analysisStatus : ${c('bold', finalRecord.analysisStatus)}`)
  console.log(`  retryCount     : ${finalRecord.retryCount ?? 0}`)
  console.log(`  analysis       : ${finalRecord.analysis ? c('green', '[present]') : c('red', '[absent]')}`)

  console.log(`\n${c('cyan', 'Final metrics (analyze_metrics/global):')}`)
  if (finalMetrics) {
    const keys = ['totalCount','successCount','failureCount','timeoutCount','retryCount','retrySuccessCount','skipCount','totalDurationMs']
    for (const k of keys) {
      console.log(`  ${k.padEnd(20)}: ${finalMetrics[k] ?? 0}`)
    }
  } else {
    console.log(`  ${c('red', '(document not created)')}`)
  }

  // ── Assertions ───────────────────────────────────────────────────────────
  console.log(`\n${c('cyan', 'Assertions:')}`)

  const m = finalMetrics || {}

  if (seedRecord.analysisStatus === 'done') {
    // ── Already-done scenario ─────────────────────────────────────────────
    assert(writeWinners.length === 0,
      'No conditional write attempted (all skipped)',
      `winners=${writeWinners.length}`)

    assert(finalRecord.analysisStatus === 'done',
      'Record status remains done')

    assert(successes.length === CONCURRENCY,
      `All ${CONCURRENCY} invocations returned success:true (from cached data)`,
      `actual=${successes.length}`)

    // All 10 invocations call recordMetrics({totalCount:1, skipCount:1}).
    // The retry-on-duplicate upsert ensures every increment lands.
    assert((m.totalCount || 0) === CONCURRENCY,
      `metrics.totalCount === ${CONCURRENCY} (all skip invocations counted)`,
      `actual=${m.totalCount}`)

    assert((m.skipCount || 0) === CONCURRENCY,
      `metrics.skipCount === ${CONCURRENCY} (all ${CONCURRENCY} skips counted)`,
      `actual=${m.skipCount}`)

    assert((m.successCount || 0) === 0,
      'metrics.successCount === 0 (no new analysis ran)',
      `actual=${m.successCount}`)

    assert(throws.length === 0,
      'No invocation threw an exception',
      `throws=${throws.length}`)

  } else if (!FORCE_TIMEOUT) {
    // ── Normal concurrent scenario ────────────────────────────────────────
    assert(writeWinners.length === 1,
      'Exactly one invocation won the conditional write',
      `winners=${writeWinners.length} (indices: ${writeWinners.join(',')})`)

    assert(writeAttempts.filter(a => !a.won).length === CONCURRENCY - 1,
      `${CONCURRENCY - 1} invocations lost the conditional write`,
      `losers=${writeAttempts.filter(a => !a.won).length}`)

    assert(finalRecord.analysisStatus === 'done',
      "Final record analysisStatus === 'done'",
      `actual=${finalRecord.analysisStatus}`)

    assert(finalRecord.analysis !== undefined,
      'Final record has analysis JSON',
      `analysis=${finalRecord.analysis ? '[present]' : '[absent]'}`)

    // ── Caller-visible results ────────────────────────────────────────────
    assert(successes.length === 1,
      'Exactly 1 invocation returned success:true to caller',
      `actual=${successes.length}`)

    assert(failures.length === CONCURRENCY - 1,
      `${CONCURRENCY - 1} invocations returned success:false (stale write skipped)`,
      `actual=${failures.length}`)

    // ── Metrics accuracy ──────────────────────────────────────────────────
    // Only the write-winner calls recordMetrics({totalCount:1, successCount:1}).
    // The 9 stale-write losers return success:false and are gated out by the
    // if (analysisResult.success) check — they call no recordMetrics at all.
    // The retry-on-duplicate upsert ensures the winner's increments always land.
    assert((m.totalCount || 0) === 1,
      'metrics.totalCount === 1 (only write-winner counted)',
      `actual=${m.totalCount}`)

    assert((m.successCount || 0) === 1,
      'metrics.successCount === 1 (only write-winner counted)',
      `actual=${m.successCount}`)

    assert((m.failureCount || 0) === 0,
      'metrics.failureCount === 0 (no error path triggered)',
      `actual=${m.failureCount}`)

    assert(throws.length === 0,
      'No invocation threw an exception',
      `throws=${throws.length}`)

    // Verify metric counters are non-negative integers
    const metricsKeys = ['totalCount','successCount','failureCount','timeoutCount','retryCount','retrySuccessCount','skipCount']
    for (const k of metricsKeys) {
      assert((m[k] || 0) >= 0 && Number.isInteger(m[k] || 0),
        `metrics.${k} is a non-negative integer`,
        `actual=${m[k]}`)
    }

  } else {
    // ── Forced-timeout / retry scenario ──────────────────────────────────
    // Every invocation times out.  retryCount on the record should be 1
    // (last writer wins, but all write the same value).
    // All fail after MAX_RETRIES=1.
    assert(finalRecord.analysisStatus === 'failed',
      "Final record analysisStatus === 'failed' (all timed out)",
      `actual=${finalRecord.analysisStatus}`)

    assert((m.timeoutCount || 0) >= 1,
      'metrics.timeoutCount >= 1',
      `actual=${m.timeoutCount}`)

    assert((m.retryCount || 0) >= 1,
      'metrics.retryCount >= 1',
      `actual=${m.retryCount}`)

    assert((m.failureCount || 0) >= 1,
      'metrics.failureCount >= 1',
      `actual=${m.failureCount}`)

    assert(throws.length === 0,
      'No invocation threw an exception (errors returned, not thrown)',
      `throws=${throws.length}`)
  }

  // ── Expected DB state printout ───────────────────────────────────────────
  console.log(`\n${c('cyan', 'Expected DB state after test:')}`)
  if (seedRecord.analysisStatus === 'done') {
    console.log(`  records/${RECORD_ID}.analysisStatus  = 'done'  (unchanged)`)
    console.log(`  analyze_metrics/global.totalCount   = ${CONCURRENCY}`)
    console.log(`  analyze_metrics/global.skipCount    = ${CONCURRENCY}`)
  } else if (!FORCE_TIMEOUT) {
    console.log(`  records/${RECORD_ID}.analysisStatus  = 'done'`)
    console.log(`  records/${RECORD_ID}.analysis        = [JSON string]`)
    console.log(`  analyze_metrics/global.totalCount   = 1  (only write-winner)`)
    console.log(`  analyze_metrics/global.successCount = 1  (only write-winner)`)
    console.log(`  analyze_metrics/global.skipCount    = 0`)
    console.log(`  analyze_metrics/global.failureCount = 0`)
    console.log(`  (${CONCURRENCY-1} stale-write invocations return success:false, gated from recordMetrics)`)
  } else {
    console.log(`  records/${RECORD_ID}.analysisStatus  = 'failed'`)
    console.log(`  records/${RECORD_ID}.retryCount      = 1`)
    console.log(`  analyze_metrics/global.timeoutCount = ${CONCURRENCY} (one per first attempt)`)
    console.log(`  analyze_metrics/global.retryCount   = ${CONCURRENCY}`)
    console.log(`  analyze_metrics/global.failureCount = ${CONCURRENCY} (all fail after retry)`)
  }

  return { label, assertionsFailed: assertionsFailed }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

;(async () => {
  console.log(c('bold', '\nanalyzeRecord Concurrency Test'))
  console.log(c('dim', `mode: ${FORCE_TIMEOUT ? '--timeout (retry scenario)' : 'normal'}`))
  console.log(c('dim', `concurrency: ${CONCURRENCY}`))

  const baseRecord = {
    behavior:       '爬行',
    category:       'motor',
    ageInMonths:    9,
    analysisStatus: 'pending',
    retryCount:     0,
  }

  if (FORCE_TIMEOUT) {
    // Single scenario: all invocations timeout and exhaust retries
    await runScenario('10 concurrent invocations — all timeout (retry exhausted)', baseRecord)
  } else {
    // Scenario 1: normal — all start from pending, race for the write
    await runScenario('10 concurrent invocations — pending record (race for write)', baseRecord)

    // Scenario 2: record already done — all should skip
    const doneRecord = {
      ...baseRecord,
      analysisStatus: 'done',
      analysis: JSON.stringify({ source: 'local', developmentStage: 'prior' }),
    }
    await runScenario('10 concurrent invocations — record already done (idempotency)', doneRecord)

    // Scenario 3: record stuck in 'analyzing' (e.g. prior invocation crashed mid-flight)
    const stuckRecord = { ...baseRecord, analysisStatus: 'analyzing' }
    await runScenario('10 concurrent invocations — record stuck in analyzing state', stuckRecord)
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(70)}`)
  if (assertionsFailed === 0) {
    console.log(c('green', c('bold', '  ALL ASSERTIONS PASSED')))
  } else {
    console.log(c('red', c('bold', `  ${assertionsFailed} ASSERTION(S) FAILED`)))
  }
  console.log(`${'═'.repeat(70)}\n`)

  process.exit(assertionsFailed > 0 ? 1 : 0)
})()
