const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action } = event

  try {
    switch (action) {
      case 'list':
        return await listChildren(OPENID)
      case 'get':
        return await getChild(OPENID, event.id)
      case 'create':
        return await createChild(OPENID, event.data)
      case 'update':
        return await updateChild(OPENID, event.id, event.data)
      case 'delete':
        return await deleteChild(OPENID, event.id)
      case 'updateAvatar':
        return await updateAvatar(OPENID, event.id, event.fileId)
      default:
        return { success: false, error: 'Unknown action' }
    }
  } catch (err) {
    console.error(`children/${action} error:`, err)
    return { success: false, error: err.message || 'Internal error' }
  }
}

async function listChildren(openid) {
  const { data } = await db.collection('children')
    .where({ _openid: openid })
    .orderBy('createdAt', 'desc')
    .get()

  // Fetch latest record for each child
  const childrenWithRecords = await Promise.all(
    data.map(async (child) => {
      const { data: records } = await db.collection('records')
        .where({ childId: child._id, _openid: openid })
        .orderBy('date', 'desc')
        .limit(5)
        .get()
      return { ...normalizeChild(child), records: records.map(normalizeRecord) }
    })
  )

  return { success: true, data: childrenWithRecords }
}

async function getChild(openid, id) {
  const { data } = await db.collection('children').doc(id).get()
  if (data._openid !== openid) {
    return { success: false, error: 'Permission denied' }
  }

  const { data: records } = await db.collection('records')
    .where({ childId: id, _openid: openid })
    .orderBy('date', 'desc')
    .get()

  return {
    success: true,
    data: { ...normalizeChild(data), records: records.map(normalizeRecord) },
  }
}

async function createChild(openid, childData) {
  const now = db.serverDate()
  const { _id } = await db.collection('children').add({
    data: {
      name: childData.name,
      birthDate: new Date(childData.birthDate),
      gender: childData.gender,
      avatarFileId: null,
      createdAt: now,
      updatedAt: now,
    },
  })

  // Ensure user exists
  const { data: users } = await db.collection('users').where({ _openid: openid }).limit(1).get()
  if (users.length === 0) {
    await db.collection('users').add({
      data: { status: 'active', createdAt: now, updatedAt: now },
    })
  }

  return {
    success: true,
    data: {
      id: _id,
      name: childData.name,
      birthDate: childData.birthDate,
      gender: childData.gender,
      avatarUrl: null,
      ownerUid: openid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      records: [],
    },
  }
}

async function updateChild(openid, id, updateData) {
  const { data: existing } = await db.collection('children').doc(id).get()
  if (existing._openid !== openid) {
    return { success: false, error: 'Permission denied' }
  }

  const fields = {}
  if (updateData.name !== undefined) fields.name = updateData.name
  if (updateData.birthDate !== undefined) fields.birthDate = new Date(updateData.birthDate)
  if (updateData.gender !== undefined) fields.gender = updateData.gender
  fields.updatedAt = db.serverDate()

  await db.collection('children').doc(id).update({ data: fields })

  return { success: true, data: { id, ...updateData } }
}

async function deleteChild(openid, id) {
  const { data: existing } = await db.collection('children').doc(id).get()
  if (existing._openid !== openid) {
    return { success: false, error: 'Permission denied' }
  }

  // Delete associated records
  const { data: records } = await db.collection('records')
    .where({ childId: id, _openid: openid })
    .get()

  // Delete record images from cloud storage
  const fileIds = records
    .map((r) => r.imageFileId)
    .filter(Boolean)
  if (fileIds.length > 0) {
    await cloud.deleteFile({ fileList: fileIds })
  }

  // Batch delete records (CloudDB limit: 20 per batch in where-delete)
  if (records.length > 0) {
    await db.collection('records').where({ childId: id, _openid: openid }).remove()
  }

  // Delete avatar from cloud storage
  if (existing.avatarFileId) {
    await cloud.deleteFile({ fileList: [existing.avatarFileId] })
  }

  // Delete child
  await db.collection('children').doc(id).remove()

  return { success: true, data: null }
}

async function updateAvatar(openid, id, fileId) {
  const { data: existing } = await db.collection('children').doc(id).get()
  if (existing._openid !== openid) {
    return { success: false, error: 'Permission denied' }
  }

  // Delete old avatar
  if (existing.avatarFileId) {
    await cloud.deleteFile({ fileList: [existing.avatarFileId] })
  }

  await db.collection('children').doc(id).update({
    data: { avatarFileId: fileId, updatedAt: db.serverDate() },
  })

  // Get temp URL for the new avatar
  let avatarUrl = null
  if (fileId) {
    const { fileList } = await cloud.getTempFileURL({ fileList: [fileId] })
    avatarUrl = fileList[0]?.tempFileURL || null
  }

  return { success: true, data: { id, avatarUrl } }
}

// Normalize CloudDB document to match the existing API response format
function normalizeChild(doc) {
  return {
    id: doc._id,
    name: doc.name,
    birthDate: doc.birthDate instanceof Date ? doc.birthDate.toISOString() : doc.birthDate,
    gender: doc.gender,
    avatarUrl: doc.avatarFileId || null,
    ownerUid: doc._openid,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
  }
}

function normalizeRecord(doc) {
  return {
    id: doc._id,
    childId: doc.childId,
    category: doc.category,
    behavior: doc.behavior,
    date: doc.date instanceof Date ? doc.date.toISOString() : doc.date,
    ageInMonths: doc.ageInMonths,
    notes: doc.notes || null,
    analysis: doc.analysis ? (typeof doc.analysis === 'string' ? doc.analysis : JSON.stringify(doc.analysis)) : null,
    milestones: doc.milestones || null,
    imageUrl: doc.imageFileId || null,
    isFavorite: doc.isFavorite || false,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  }
}
