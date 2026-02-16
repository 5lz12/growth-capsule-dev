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
        return await listRecords(OPENID, event.childId, event.query)
      case 'get':
        return await getRecord(OPENID, event.id)
      case 'create':
        return await createRecord(OPENID, event.childId, event.data)
      case 'update':
        return await updateRecord(OPENID, event.id, event.data)
      case 'delete':
        return await deleteRecord(OPENID, event.id)
      case 'toggleFavorite':
        return await toggleFavorite(OPENID, event.id)
      default:
        return { success: false, error: 'Unknown action' }
    }
  } catch (err) {
    console.error(`records/${action} error:`, err)
    return { success: false, error: err.message || 'Internal error' }
  }
}

async function listRecords(openid, childId, query = {}) {
  const where = { _openid: openid }
  if (childId) where.childId = childId
  if (query.category) where.category = query.category
  if (query.isFavorite !== undefined) where.isFavorite = query.isFavorite

  const { data } = await db.collection('records')
    .where(where)
    .orderBy('date', 'desc')
    .limit(query.limit || 50)
    .skip(query.offset || 0)
    .get()

  return { success: true, data: data.map(normalizeRecord) }
}

async function getRecord(openid, id) {
  const { data } = await db.collection('records').doc(id).get()
  if (data._openid !== openid) {
    return { success: false, error: 'Permission denied' }
  }
  return { success: true, data: normalizeRecord(data) }
}

async function createRecord(openid, childId, recordData) {
  // Verify child ownership
  const { data: child } = await db.collection('children').doc(childId).get()
  if (child._openid !== openid) {
    return { success: false, error: 'Permission denied' }
  }

  const now = db.serverDate()
  const { _id } = await db.collection('records').add({
    data: {
      childId,
      category: recordData.category,
      behavior: recordData.behavior,
      date: new Date(recordData.date),
      ageInMonths: recordData.ageInMonths,
      notes: recordData.notes || null,
      analysis: null,
      analysisStatus: 'pending',
      retryCount: 0,
      milestones: recordData.milestones || null,
      imageFileId: recordData.imageFileId || null,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    },
  })

  // Fire-and-forget: trigger async analysis
  cloud.callFunction({
    name: 'analyze',
    data: { action: 'analyzeRecord', recordId: _id },
  }).catch((err) => {
    console.error('Fire-and-forget analyze dispatch failed:', err)
  })

  return {
    success: true,
    data: {
      id: _id,
      childId,
      category: recordData.category,
      behavior: recordData.behavior,
      date: recordData.date,
      ageInMonths: recordData.ageInMonths,
      notes: recordData.notes || null,
      analysis: null,
      analysisStatus: 'pending',
      milestones: recordData.milestones || null,
      imageUrl: recordData.imageFileId || null,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    },
  }
}

async function updateRecord(openid, id, updateData) {
  const { data: existing } = await db.collection('records').doc(id).get()
  if (existing._openid !== openid) {
    return { success: false, error: 'Permission denied' }
  }

  const fields = {}
  if (updateData.category !== undefined) fields.category = updateData.category
  if (updateData.behavior !== undefined) fields.behavior = updateData.behavior
  if (updateData.date !== undefined) fields.date = new Date(updateData.date)
  if (updateData.ageInMonths !== undefined) fields.ageInMonths = updateData.ageInMonths
  if (updateData.notes !== undefined) fields.notes = updateData.notes
  if (updateData.analysis !== undefined) fields.analysis = updateData.analysis
  if (updateData.milestones !== undefined) fields.milestones = updateData.milestones
  fields.updatedAt = db.serverDate()

  await db.collection('records').doc(id).update({ data: fields })

  return { success: true, data: { id, ...updateData } }
}

async function deleteRecord(openid, id) {
  const { data: existing } = await db.collection('records').doc(id).get()
  if (existing._openid !== openid) {
    return { success: false, error: 'Permission denied' }
  }

  // Delete image from cloud storage
  if (existing.imageFileId) {
    await cloud.deleteFile({ fileList: [existing.imageFileId] })
  }

  await db.collection('records').doc(id).remove()

  return { success: true, data: null }
}

async function toggleFavorite(openid, id) {
  const { data: existing } = await db.collection('records').doc(id).get()
  if (existing._openid !== openid) {
    return { success: false, error: 'Permission denied' }
  }

  const newValue = !existing.isFavorite
  await db.collection('records').doc(id).update({
    data: { isFavorite: newValue, updatedAt: db.serverDate() },
  })

  return { success: true, data: { id, isFavorite: newValue } }
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
    analysisStatus: doc.analysisStatus || (doc.analysis ? 'done' : 'pending'),
    imageUrl: doc.imageFileId || null,
    isFavorite: doc.isFavorite || false,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  }
}
