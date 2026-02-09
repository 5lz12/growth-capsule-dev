/**
 * Multi-user migration script (idempotent)
 *
 * Prerequisites:
 *   1. Run `npx prisma db push` first to apply schema changes
 *   2. Then run `node scripts/migrate-multi-user.mjs`
 *
 * What this script does:
 *   - Creates the default user (uid_default_local) in the User table
 *   - Creates two dev test users (uid_alice, uid_bob)
 *   - Ensures all Child / Record rows have ownerUid set
 *   - Migrates uploaded files to user-namespaced directories
 *   - Updates imageUrl / avatarUrl references in the database
 *
 * Idempotency: safe to run multiple times - uses upsert and checks before moving files.
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const DEFAULT_UID = 'uid_default_local'
const CWD = process.cwd()

async function main() {
  console.log('=== Multi-user migration start ===\n')

  // ── Step 1: Create users ──────────────────────────────────────────
  console.log('[1/5] Creating user records...')
  const users = [
    { uid: DEFAULT_UID, status: 'active' },
    { uid: 'uid_alice', status: 'active' },
    { uid: 'uid_bob', status: 'active' },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { uid: u.uid },
      update: {},
      create: { uid: u.uid, status: u.status },
    })
    console.log(`  ✓ User "${u.uid}" ensured`)
  }

  // ── Step 2: Backfill ownerUid on Child ────────────────────────────
  // Note: @default("uid_default_local") in schema means db push already sets
  // the default for existing rows. This step handles edge cases (empty string).
  console.log('\n[2/5] Backfilling Child.ownerUid...')
  const childBackfill = await prisma.child.updateMany({
    where: { ownerUid: '' },
    data: { ownerUid: DEFAULT_UID },
  })
  if (childBackfill.count > 0) {
    console.log(`  ✓ Updated ${childBackfill.count} children`)
  } else {
    console.log('  ✓ All children already have ownerUid')
  }

  // ── Step 3: Backfill ownerUid on Record ───────────────────────────
  console.log('\n[3/5] Backfilling Record.ownerUid...')
  const recordBackfill = await prisma.record.updateMany({
    where: { ownerUid: '' },
    data: { ownerUid: DEFAULT_UID },
  })
  if (recordBackfill.count > 0) {
    console.log(`  ✓ Updated ${recordBackfill.count} records`)
  } else {
    console.log('  ✓ All records already have ownerUid')
  }

  // ── Step 4: Migrate uploaded files to user-namespaced paths ───────
  console.log('\n[4/5] Migrating uploaded files...')

  // Migrate avatars
  await migrateFiles(
    path.join(CWD, 'public', 'uploads', 'avatars'),
    path.join(CWD, 'public', 'uploads', 'users', DEFAULT_UID, 'avatars'),
    '/uploads/avatars/',
    `/uploads/users/${DEFAULT_UID}/avatars/`
  )

  // Migrate record images
  await migrateFiles(
    path.join(CWD, 'public', 'uploads', 'records'),
    path.join(CWD, 'public', 'uploads', 'users', DEFAULT_UID, 'records'),
    '/uploads/records/',
    `/uploads/users/${DEFAULT_UID}/records/`
  )

  // Update avatarUrl in Child table
  const childrenWithOldAvatar = await prisma.child.findMany({
    where: {
      avatarUrl: { startsWith: '/uploads/avatars/' },
    },
  })
  for (const child of childrenWithOldAvatar) {
    const newUrl = child.avatarUrl.replace(
      '/uploads/avatars/',
      `/uploads/users/${DEFAULT_UID}/avatars/`
    )
    await prisma.child.update({
      where: { id: child.id },
      data: { avatarUrl: newUrl },
    })
  }
  if (childrenWithOldAvatar.length > 0) {
    console.log(`  ✓ Updated ${childrenWithOldAvatar.length} avatar URLs`)
  }

  // Update imageUrl in Record table
  const recordsWithOldImage = await prisma.record.findMany({
    where: {
      imageUrl: { startsWith: '/uploads/records/' },
    },
  })
  for (const record of recordsWithOldImage) {
    const newUrl = record.imageUrl.replace(
      '/uploads/records/',
      `/uploads/users/${DEFAULT_UID}/records/`
    )
    await prisma.record.update({
      where: { id: record.id },
      data: { imageUrl: newUrl },
    })
  }
  if (recordsWithOldImage.length > 0) {
    console.log(`  ✓ Updated ${recordsWithOldImage.length} record image URLs`)
  }

  // Also handle generic uploads (files in /uploads/ root that are referenced)
  const recordsWithGenericImage = await prisma.record.findMany({
    where: {
      imageUrl: { startsWith: '/uploads/' },
      NOT: { imageUrl: { startsWith: '/uploads/users/' } },
    },
  })
  for (const record of recordsWithGenericImage) {
    // Move the file
    const filename = path.basename(record.imageUrl)
    const oldPath = path.join(CWD, 'public', record.imageUrl)
    const newDir = path.join(CWD, 'public', 'uploads', 'users', DEFAULT_UID, 'records')
    const newPath = path.join(newDir, filename)
    if (existsSync(oldPath) && !existsSync(newPath)) {
      await fs.mkdir(newDir, { recursive: true })
      await fs.copyFile(oldPath, newPath)
    }
    const newUrl = `/uploads/users/${DEFAULT_UID}/records/${filename}`
    await prisma.record.update({
      where: { id: record.id },
      data: { imageUrl: newUrl },
    })
  }
  if (recordsWithGenericImage.length > 0) {
    console.log(`  ✓ Migrated ${recordsWithGenericImage.length} generic upload URLs`)
  }

  // ── Step 5: Verification ──────────────────────────────────────────
  console.log('\n[5/5] Verification...')
  const totalUsers = await prisma.user.count()
  const totalChildren = await prisma.child.count()
  const totalRecords = await prisma.record.count()
  const childrenWithOwner = await prisma.child.count({ where: { ownerUid: { not: '' } } })
  const recordsWithOwner = await prisma.record.count({ where: { ownerUid: { not: '' } } })

  console.log(`  Users: ${totalUsers}`)
  console.log(`  Children: ${totalChildren} (with ownerUid: ${childrenWithOwner})`)
  console.log(`  Records: ${totalRecords} (with ownerUid: ${recordsWithOwner})`)

  if (childrenWithOwner === totalChildren && recordsWithOwner === totalRecords) {
    console.log('\n=== Migration completed successfully! ===')
  } else {
    console.error('\n⚠ WARNING: Some rows may not have ownerUid set. Check manually.')
  }
}

/**
 * Copy files from oldDir to newDir, without deleting originals (safe migration).
 */
async function migrateFiles(oldDir, newDir, _oldPrefix, _newPrefix) {
  if (!existsSync(oldDir)) {
    console.log(`  ⊘ Source directory does not exist: ${oldDir}`)
    return
  }

  await fs.mkdir(newDir, { recursive: true })

  const files = await fs.readdir(oldDir)
  let copied = 0

  for (const file of files) {
    const srcPath = path.join(oldDir, file)
    const destPath = path.join(newDir, file)

    // Skip if already exists at destination (idempotent)
    if (existsSync(destPath)) continue

    const stat = await fs.stat(srcPath)
    if (stat.isFile()) {
      await fs.copyFile(srcPath, destPath)
      copied++
    }
  }

  console.log(`  ✓ Copied ${copied} files from ${path.basename(oldDir)} → users/${DEFAULT_UID}/${path.basename(newDir)}`)
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
