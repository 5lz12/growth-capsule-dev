/**
 * AI analyzer — production-grade implementation.
 *
 * Contract: analyze(record) → { analysis, source }
 *   analysis — flat object matching the stored DB schema
 *   source   — 'ai'
 *
 * This module is pure computation — no DB access.
 *
 * Env vars (set in WeChat cloud console):
 *   AI_API_KEY       — API key (required)
 *   AI_API_ENDPOINT  — full URL (required)
 *   AI_MODEL         — model name (optional, defaults per format)
 *   AI_API_FORMAT    — 'openai' | 'anthropic' (optional, auto-detected from endpoint)
 *   AI_TIMEOUT_MS    — per-attempt fetch timeout in ms (default: 15000)
 *   AI_MAX_RETRIES   — max retry attempts on retryable errors (default: 2)
 *
 * Error contract:
 *   analyze() throws an AiError with { type, message, retryable } on failure.
 *   Callers (hybrid.js) inspect err.retryable to decide whether to fall back.
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const AI_API_KEY      = process.env.AI_API_KEY      || ''
const AI_API_ENDPOINT = process.env.AI_API_ENDPOINT || ''
const AI_MODEL        = process.env.AI_MODEL        || ''
const AI_TIMEOUT_MS   = parseInt(process.env.AI_TIMEOUT_MS  || '15000', 10)
const AI_MAX_RETRIES  = parseInt(process.env.AI_MAX_RETRIES || '2',     10)

function detectFormat() {
  const explicit = process.env.AI_API_FORMAT
  if (explicit === 'anthropic') return 'anthropic'
  if (explicit === 'openai') return 'openai'
  if (AI_API_ENDPOINT.includes('anthropic.com')) return 'anthropic'
  return 'openai'
}

const AI_FORMAT = detectFormat()

function getDefaultModel() {
  if (AI_MODEL) return AI_MODEL
  return AI_FORMAT === 'anthropic' ? 'claude-sonnet-4-20250514' : 'gpt-4o'
}

// ─── Error classification ─────────────────────────────────────────────────────

/**
 * Normalized AI error.
 * @typedef {{ type: 'timeout'|'network'|'api_4xx'|'api_5xx'|'parse'|'schema', message: string, retryable: boolean }} AiError
 */

function makeError(type, message) {
  const retryable = type === 'timeout' || type === 'network' || type === 'api_5xx'
  const err = new Error(message)
  err.type = type
  err.retryable = retryable
  return err
}

// ─── Internal metrics (fire-and-forget console counters) ─────────────────────

const _metrics = {
  ai_calls:    0,
  ai_success:  0,
  ai_timeout:  0,
  ai_error:    0,
  ai_retry:    0,
  ai_fallback: 0,
}

function _logMetrics(event) {
  _metrics[event] = (_metrics[event] || 0) + 1
  console.log('[ai:metrics]', JSON.stringify(_metrics))
}

// ─── Structured logging ───────────────────────────────────────────────────────

function _log(fields) {
  console.log('[ai]', JSON.stringify(fields))
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  motor: '运动发展',
  language: '语言发展',
  social: '社交能力',
  cognitive: '认知发展',
  emotional: '情感发展',
}

function formatAge(ageInMonths) {
  if (ageInMonths < 12) return `${ageInMonths}个月`
  const years = Math.floor(ageInMonths / 12)
  const months = ageInMonths % 12
  return months > 0 ? `${years}岁${months}个月` : `${years}岁`
}

function buildPrompt(record) {
  const { behavior, category, ageInMonths, context } = record
  const ageDesc = formatAge(ageInMonths)

  return `请分析以下儿童行为，并严格以 JSON 格式返回分析结果（不要包含任何 JSON 之外的文字）。

儿童信息：
- 年龄：${ageDesc}（${ageInMonths}个月）
- 行为类别：${CATEGORY_LABELS[category] || category}
- 行为描述：${behavior}
- 上下文：${context || '无'}

请返回以下格式的 JSON：
{
  "developmentStage": "发展阶段描述",
  "psychologicalInterpretation": "基于发展心理学的专业解读（200字左右），需引用具体理论如皮亚杰、维果茨基、埃里克森等",
  "emotionalInterpretation": "面向父母的情感共鸣型解读（100字左右）",
  "parentingSuggestions": [
    {
      "type": "observe|emotional|guidance|none",
      "content": "建议内容",
      "theoryReference": "理论出处",
      "deepInsight": "基于具体行为的深度洞察（100字左右）"
    }
  ],
  "milestone": "对应的发育里程碑（如果有）",
  "confidenceLevel": "high|medium|low"
}

建议类型说明：
- observe: 持续观察，无需干预
- emotional: 提供情绪支持，接纳和共情
- guidance: 适度引导，但不强迫
- none: 一切正常，无需建议

要求：
1. 基于皮亚杰、维果茨基、埃里克森、鲍尔比、蒙台梭利、托马斯与切斯等经典发展理论
2. 每条建议必须明确标注理论出处
3. 深度洞察要结合具体行为，揭示现象背后的深层机制
4. 分析要克制，不夸大，避免给家长造成焦虑
5. 大部分情况下应该是 observe 类型，强调"无需特殊干预"
6. 建议要实用、可操作，避免空泛
7. 考虑月龄特点，给出符合发展规律的分析
8. 【重要】描述年龄时必须使用"X岁Y个月"格式（如"7岁11个月"），绝对不要使用"XX个月大"的原始月龄表述
9. 【重要】引用皮亚杰阶段时必须准确：感知运动阶段（0-2岁）、前运算阶段（2-7岁）、具体运算阶段（7-11岁）、形式运算阶段（11岁+）
10. 【重要】引用埃里克森阶段时必须准确：信任vs不信任（0-1岁）、自主vs羞愧（1-3岁）、主动vs内疚（3-6岁）、勤奋vs自卑（6-12岁）、自我认同vs角色混淆（12-18岁）
`
}

// ─── HTTP calls (with AbortController timeout) ────────────────────────────────

async function fetchWithTimeout(url, options) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } catch (err) {
    if (err.name === 'AbortError') {
      throw makeError('timeout', `[ai] timeout after ${AI_TIMEOUT_MS}ms`)
    }
    throw makeError('network', `[ai] network error: ${err.message}`)
  } finally {
    clearTimeout(timer)
  }
}

async function callAnthropic(prompt, model) {
  const response = await fetchWithTimeout(AI_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': AI_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    const type = response.status >= 500 ? 'api_5xx' : 'api_4xx'
    throw makeError(type, `[ai] Anthropic API ${response.status}: ${errorBody}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

async function callOpenAICompatible(prompt, model) {
  const response = await fetchWithTimeout(AI_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: '你是一位儿童发展心理学专家，擅长基于皮亚杰、维果茨基、埃里克森、鲍尔比等经典发展理论分析儿童行为。请严格按照用户要求的 JSON 格式返回结果，不要包含任何额外文字。',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    const type = response.status >= 500 ? 'api_5xx' : 'api_4xx'
    throw makeError(type, `[ai] API ${response.status}: ${errorBody}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// ─── Response parsing ─────────────────────────────────────────────────────────

const VALID_SUGGESTION_TYPES = ['observe', 'emotional', 'guidance', 'none']
const VALID_CONFIDENCE_LEVELS = ['high', 'medium', 'low']

function parseResponse(text) {
  // Try to extract JSON from markdown code block first
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim()

  let parsed
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    // Fall back to finding outermost braces
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end === -1) {
      throw makeError('parse', '[ai] failed to parse response as JSON')
    }
    try {
      parsed = JSON.parse(text.slice(start, end + 1))
    } catch {
      throw makeError('parse', '[ai] failed to parse response as JSON (brace fallback)')
    }
  }

  // Validate required fields
  if (!parsed.developmentStage && !parsed.psychologicalInterpretation) {
    throw makeError('schema', '[ai] response missing required fields: developmentStage, psychologicalInterpretation')
  }

  const parentingSuggestions = Array.isArray(parsed.parentingSuggestions)
    ? parsed.parentingSuggestions.map((s) => ({
        type: VALID_SUGGESTION_TYPES.includes(s.type) ? s.type : 'observe',
        content: String(s.content || ''),
        theoryReference: s.theoryReference ? String(s.theoryReference) : null,
        deepInsight: s.deepInsight ? String(s.deepInsight) : null,
      }))
    : []

  const confidenceLevel = VALID_CONFIDENCE_LEVELS.includes(parsed.confidenceLevel)
    ? parsed.confidenceLevel
    : 'medium'

  return {
    developmentStage: String(parsed.developmentStage || ''),
    psychologicalInterpretation: String(parsed.psychologicalInterpretation || ''),
    emotionalInterpretation: parsed.emotionalInterpretation ? String(parsed.emotionalInterpretation) : null,
    parentingSuggestions,
    milestone: parsed.milestone ? String(parsed.milestone) : null,
    confidenceLevel,
  }
}

// ─── Single attempt ───────────────────────────────────────────────────────────

async function callOnce(prompt, model) {
  const responseText = AI_FORMAT === 'anthropic'
    ? await callAnthropic(prompt, model)
    : await callOpenAICompatible(prompt, model)

  return parseResponse(responseText)
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * @param {object} record  The full record document from DB.
 * @returns {{ analysis: object, source: string }}
 * @throws {AiError}
 */
async function analyze(record) {
  if (!AI_API_KEY || !AI_API_ENDPOINT) {
    throw makeError('schema', '[ai] not configured: missing AI_API_KEY or AI_API_ENDPOINT')
  }

  const prompt = buildPrompt(record)
  const model = getDefaultModel()

  _metrics.ai_calls++
  _logMetrics('ai_calls')

  let lastErr
  for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
    const t0 = Date.now()

    try {
      const analysis = await callOnce(prompt, model)
      const duration_ms = Date.now() - t0
      _log({ attempt, duration_ms, status: 'success' })
      _logMetrics('ai_success')
      return { analysis, source: 'ai' }
    } catch (err) {
      const duration_ms = Date.now() - t0
      lastErr = err

      // Normalize non-AiErrors (unexpected throws)
      if (!err.type) {
        lastErr = makeError('network', `[ai] unexpected error: ${err.message}`)
      }

      const retrying = lastErr.retryable && attempt < AI_MAX_RETRIES

      _log({
        attempt,
        duration_ms,
        error_type: lastErr.type,
        retrying,
      })

      if (lastErr.type === 'timeout') _logMetrics('ai_timeout')
      else _logMetrics('ai_error')

      if (!retrying) break

      _logMetrics('ai_retry')

      // Exponential backoff with jitter: 500ms * 2^attempt + [0, 200)ms
      const backoff = 500 * Math.pow(2, attempt) + Math.floor(Math.random() * 200)
      await new Promise((resolve) => setTimeout(resolve, backoff))
    }
  }

  throw lastErr
}

module.exports = { analyze, _metrics }
