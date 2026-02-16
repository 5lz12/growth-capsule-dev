const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action = 'ensureLogin' } = event

  switch (action) {
    case 'ensureLogin':
      return ensureLogin(OPENID)
    case 'getProfile':
      return getProfile(OPENID)
    default:
      return { success: false, error: 'Unknown action' }
  }
}

async function ensureLogin(openid) {
  const col = db.collection('users')
  const { data } = await col.where({ _openid: openid }).limit(1).get()

  if (data.length > 0) {
    return { success: true, data: { openid, isNew: false } }
  }

  await col.add({
    data: {
      status: 'active',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate(),
    },
  })

  return { success: true, data: { openid, isNew: true } }
}

async function getProfile(openid) {
  const { data } = await db.collection('users').where({ _openid: openid }).limit(1).get()
  if (data.length === 0) {
    return { success: false, error: 'User not found' }
  }
  return { success: true, data: data[0] }
}
