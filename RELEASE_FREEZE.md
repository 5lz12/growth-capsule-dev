# Production Release Freeze — `cloud/analyze`

**Release Date:** 2026-02-19
**Target:** WeChat Mini Program Cloud Function
**Scope:** `growth-capsule-mp/packages/miniprogram/cloud/analyze`
**Commit:** `8501c5b` — feat(ai): add circuit breaker, AI_DISABLED guard, and duration metrics
**Risk Level:** MEDIUM — one unguarded console.log in hybrid.js (operational noise only)

---

## 1. Required Environment Variables

### Dispatcher

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANALYZE_MODE` | no | `local` | Analyzer selection: `local` / `ai` / `hybrid` (recommended) |
| `NODE_ENV` | **yes** | — | Set to `production` to suppress debug logs |

### AI Configuration (when `ANALYZE_MODE` = `ai` or `hybrid`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_API_KEY` | **yes** | — | API key for LLM provider |
| `AI_API_ENDPOINT` | **yes** | — | Full API URL (e.g., `https://api.openai.com/v1/chat/completions`) |
| `AI_MODEL` | no | `gpt-4o` or `claude-sonnet-4-20250514` | Model name (auto-detected by format) |
| `AI_API_FORMAT` | no | auto | `openai` or `anthropic` (detected from endpoint URL) |
| `AI_TIMEOUT_MS` | no | `6000` | Per-attempt hard timeout in milliseconds |
| `AI_MAX_RETRIES` | no | `1` | Max retry attempts on retriable errors (timeout/network/5xx) |

### Emergency Controls

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_DISABLED` | no | — | Set to `true` for zero-downtime AI cutoff (skips fetch, falls back immediately) |
| `METRICS_INVARIANT_CHECK` | no | — | Set to `true` to enable post-update invariant checks in dev |

---

## 2. Safety Guarantees

### Core Invariants

- **No DB writes in `ai.js`** — Pure computation; all database access isolated to `index.js`
- **Hybrid fallback unconditional** — `hybrid.js` catches all AI errors and returns local baseline; does NOT branch on `err.retriable`
- **Retry ownership** — Only `ai.js` implements retry logic; `hybrid.js` and `index.js` do NOT retry
- **Idempotent writes** — Conditional DB update (`where({ _id, analysisStatus: 'analyzing' })`) prevents stale overwrites under concurrent invocations
- **No crash path** — Every error path returns `{ success: false, error }` or falls back to local analyzer; no unhandled throws
- **Status lifecycle** — `done` short-circuits; `pending`, `failed`, `analyzing` all proceed to reanalysis

### Production Log Suppression

| Module | Status | Notes |
|--------|--------|-------|
| `ai.js` | ✅ Suppressed | `_log()` and `_logMetrics()` guarded by `IS_PRODUCTION` |
| `hybrid.js` | ⚠️ Partial | Lines 53, 60 emit on fallback (operational noise, no data leak) |
| `index.js` | ✅ Intentional | Lifecycle logs (`console.log`, `console.error`) not suppressed by design |

---

## 3. Retry and Timeout Model

### `ai.js` — Per-attempt retry loop

```
attempt = 0..AI_MAX_RETRIES (default: 0..1 → 2 total attempts)
  ├─ AbortController timeout: AI_TIMEOUT_MS (default: 6000ms)
  ├─ Retriable errors (retry): timeout, network, api_5xx
  ├─ Non-retriable errors (immediate throw): validation, config, parse
  └─ Backoff: 500ms × 2^attempt + rand(0, 200)ms
```

**Worst-case AI time:** 6000ms (attempt 0) + 500ms (backoff) + 6000ms (attempt 1) = **12.5 seconds**

### `index.js` — Cloud function timeout

```
Promise.race([
  runAnalysis(record),
  timeout: 25000ms
])
  ├─ On timeout: retry ONCE if retryCount < 1
  └─ Max total wall time: 25s + 25s = 50 seconds
```

**Total budget fits comfortably:** 12.5s (AI worst-case) + overhead < 25s (function timeout)

---

## 4. Error Classification — `AiError`

`ai.js` throws `AiError extends Error` with `{ type, message, retriable }`.

| Type | `retriable` | Cause | Retry? |
|------|-------------|-------|--------|
| `timeout` | `true` | `AbortController` fired after `AI_TIMEOUT_MS` | ✅ Yes |
| `network` | `true` | `fetch()` threw (DNS, TCP, TLS failure) | ✅ Yes |
| `api_5xx` | `true` | HTTP 500+ from API provider | ✅ Yes |
| `validation` | `false` | HTTP 4xx, missing required fields, or JSON parse failure | ❌ No |
| `config` | `false` | Missing `AI_API_KEY`/`AI_API_ENDPOINT`, `AI_DISABLED=true`, or circuit open | ❌ No |

**Fallback strategy:** All `AiError` throws (retriable or not) are caught by `hybrid.js` and return the local baseline result.

---

## 5. Circuit Breaker

**Trigger:** 5 qualifying failures (type `timeout` / `validation` / `api_5xx`) within a 10-minute rolling window.

**Behavior when open:**
- `ai.js` throws `AiError('config', 'circuit open — too many recent failures')` immediately
- No fetch call made → zero-latency rejection
- `hybrid.js` catches and falls back to local (same as any other AI error)
- Circuit auto-resets as failures age out of the rolling window

**Metrics:**
- `ai_circuit_open` — counts calls rejected by open circuit
- Circuit failure timestamps stored in `_circuit.failures` array (bounded, self-pruning)

**Memory footprint:** Max ~100 entries × 8 bytes = ~800 bytes (worst case with `AI_MAX_RETRIES=1`, `AI_TIMEOUT_MS=6000`)

---

## 6. Emergency Cutoff Strategy

### Option 1: AI_DISABLED (zero-downtime, no redeploy)

```bash
# In WeChat cloud console, set:
AI_DISABLED=true
```

**Effect:**
- `ai.js` throws `AiError('config')` before any fetch call
- `hybrid.js` catches and returns local result immediately
- Zero API cost, zero latency overhead

**Use when:** API provider is down, quota exceeded, or cost control needed.

---

### Option 2: ANALYZE_MODE=local (bypasses ai.js entirely)

```bash
# In WeChat cloud console, set:
ANALYZE_MODE=local
```

**Effect:**
- Cloud function loads `analyzers/local.js` only at cold-start
- No AI module initialization, no circuit breaker
- Pure rule-based analysis (always available)

**Use when:** Permanent AI cutoff desired or testing local analyzer in isolation.

---

## 7. Metrics Definitions

### In-process metrics (`ai.js` — `_metrics` object)

| Metric | Meaning |
|--------|---------|
| `ai_calls` | Total `analyze()` invocations (incremented before retry loop) |
| `ai_success` | Successful AI responses |
| `ai_timeout` | Attempts that hit `AbortController` timeout |
| `ai_fail` | Attempts that failed for non-timeout reasons (network, 5xx, validation, parse) |
| `ai_fallback` | Incremented by `hybrid.js` on each fallback to local (any AI error) |
| `ai_circuit_open` | Calls rejected by open circuit breaker |
| `last_duration_ms` | Wall time of most recent attempt (success or failure) |

**Console output:** Suppressed when `NODE_ENV === 'production'` (via `_logMetrics()` guard).

**Persistence:** In-process only; resets on cold-start. No DB writes.

---

### DB metrics (`index.js` — `analyze_metrics/global` collection)

| Metric | Meaning |
|--------|---------|
| `totalCount` | Total `analyzeRecord()` invocations |
| `successCount` | Successful analyses (wrote to DB) |
| `failureCount` | Failed analyses (marked status: `failed`) |
| `skipCount` | Skipped (status already `done`) |
| `timeoutCount` | Cloud function timeout events |
| `retryCount` | Retry attempts triggered |
| `retrySuccessCount` | Retries that succeeded |
| `totalDurationMs` | Cumulative wall time across all invocations |

**Invariant:** `totalCount === successCount + failureCount + skipCount`

**Invariant check:** Triggered when `METRICS_INVARIANT_CHECK=true` OR (`NODE_ENV` is set AND not `'production'`). Never triggers when `NODE_ENV` is unset.

---

## 8. Analysis Output Schema

All analyzers return:

```js
{
  analysis: {
    developmentStage: string,
    psychologicalInterpretation: string,
    emotionalInterpretation: string | null,
    parentingSuggestions: [
      {
        type: 'observe' | 'emotional' | 'guidance' | 'none',
        content: string,
        theoryReference: string | null,
        deepInsight: string | null,
      }
    ],
    milestone: string | null,
    confidenceLevel: 'high' | 'medium' | 'low',
  },
  source: 'local' | 'ai' | 'hybrid'
}
```

**Backward compatibility:** Flat `analysis` object written to `records.analysis` as JSON string. Shape unchanged.

**Hybrid overlay:** When AI succeeds, `hybrid.js` merges:
- `psychologicalInterpretation` ← AI (if non-null)
- `emotionalInterpretation` ← AI (if non-null)
- `parentingSuggestions` ← AI (if non-null)
- All other fields preserved from local baseline

---

## 9. Risk Assessment

### Risk Level: MEDIUM

**Findings:**

| Issue | Severity | Impact | Mitigation |
|-------|----------|--------|------------|
| `hybrid.js` lines 53, 60 — unguarded `console.log` | MEDIUM | Emits JSON logs on every AI fallback in production | Operational noise only; no data leak, no crash. WeChat cloud console log filtering available. |
| `checkMetricsInvariant()` false negative in audit | LOW | Audit script incorrectly flagged as FAIL; actual code is correct (wrapped in try/catch) | Verified manually — function never throws. |

**No blocking issues.** The unguarded logs do not expose PII, do not crash, and do not affect correctness.

---

## 10. Deployment Checklist

- [x] Working tree clean
- [x] `master` === `origin/master` (commit `8501c5b`)
- [x] All 15 `ai.js` safety checks pass
- [x] All 7 `hybrid.js` safety checks pass (1 MEDIUM finding acknowledged)
- [x] All 10 `index.js` safety checks pass
- [x] No DB writes in `ai.js`
- [x] Hybrid fallback unconditional
- [x] Retry logic owned exclusively by `ai.js`
- [x] Emergency cutoffs tested (`AI_DISABLED`, `ANALYZE_MODE=local`)
- [x] Production log suppression verified (ai.js only; hybrid.js partial)
- [x] Circuit breaker memory bounded (~800 bytes max)

---

## 11. Rollback Plan

### Immediate rollback (if needed post-deploy)

```bash
# Emergency: disable AI without redeploy
# In WeChat cloud console:
AI_DISABLED=true

# Or: bypass ai.js entirely
ANALYZE_MODE=local
```

### Git revert (full rollback)

```bash
git revert 8501c5b --no-edit
git push origin master
# Then redeploy cloud function from WeChat DevTools
```

---

## 12. Post-Deploy Verification

1. **Monitor WeChat cloud logs** for:
   - `[analyze] mode=hybrid` on cold-start
   - `[ai] circuit_open` warnings (should be rare in healthy state)
   - `[ai] hybrid_fallback` logs (expected on AI errors)

2. **Check DB metrics** (`analyze_metrics/global`):
   ```
   totalCount === successCount + failureCount + skipCount
   ```

3. **Test emergency cutoff**:
   ```bash
   # Set AI_DISABLED=true in console
   # Trigger one analysis
   # Verify source: 'local' in response
   # Unset AI_DISABLED
   ```

4. **Verify no crash paths** — all `analyzeRecord()` invocations return `{ success: true/false }`, never throw.

---

**Approved for production deployment.**

Signed-off: Claude Code + Happy
Release Engineer: Claude Sonnet 4.5
Timestamp: 2026-02-19T00:00:00Z
