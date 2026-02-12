/**
 * WeChat Mini Program server-side helpers.
 *
 * Uses the code2session API to exchange a temporary login code
 * for the user's openid and session_key.
 *
 * Environment variables required:
 *   WECHAT_APP_ID     - Mini Program AppID
 *   WECHAT_APP_SECRET - Mini Program AppSecret
 */

interface Code2SessionResult {
  openid: string
  session_key: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

/**
 * Exchange a wx.login() code for the user's openid.
 * Throws on network or WeChat API errors.
 */
export async function wechatCode2Session(code: string): Promise<Code2SessionResult> {
  const appId = process.env.WECHAT_APP_ID
  const appSecret = process.env.WECHAT_APP_SECRET

  if (!appId || !appSecret) {
    throw new Error('WECHAT_APP_ID and WECHAT_APP_SECRET must be set')
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`WeChat API request failed: ${response.status}`)
  }

  const data: Code2SessionResult = await response.json()

  if (data.errcode && data.errcode !== 0) {
    throw new Error(`WeChat API error: ${data.errcode} - ${data.errmsg}`)
  }

  if (!data.openid) {
    throw new Error('WeChat API did not return openid')
  }

  return data
}
