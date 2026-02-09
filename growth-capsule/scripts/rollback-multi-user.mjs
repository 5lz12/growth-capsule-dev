/**
 * Rollback script for multi-user migration
 *
 * What this script does:
 *   - Restores imageUrl / avatarUrl references to their original paths
 *   - Does NOT delete user-namespaced files (safe rollback)
 *   - Does NOT drop columns (Prisma db push handles schema)
 *
 * To fully rollback the schema:
 *   1. Run this script: `node scripts/rollback-multi-user.mjs`
 *   2. Revert prisma/schema.prisma to the version without User model / ownerUid
 *   3. Run `npx prisma db push` to remove the columns
 *
 * Note: Step 3 will drop the User table and ownerUid columns.
 *       The original files are NOT deleted during migration (copies were made),
 *       so the old paths will still resolve correctly after URL rollback.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const DEFAULT_UID = 'uid_default_local'

async function main() {
  console.log('=== Multi-user rollback start ===\n')

  // ── Step 1: Restore avatar URLs ───────────────────────────────────
  console.log('[1/2] Restoring avatar URLs...')
  const childrenWithNewAvatar = await prisma.child.findMany({
    where: {
      avatarUrl: { startsWith: `/uploads/users/${DEFAULT_UID}/avatars/` },
    },
  })
  for (const child of childrenWithNewAvatar) {
    const oldUrl = child.avatarUrl.replace(
      `/uploads/users/${DEFAULT_UID}/avatars/`,
      '/uploads/avatars/'
    )
    await prisma.child.update({
      where: { id: child.id },
      data: { avatarUrl: oldUrl },
    })
  }
  console.log(`  ✓ Restored ${childrenWithNewAvatar.length} avatar URLs`)

  // ── Step 2: Restore record image URLs ─────────────────────────────
  console.log('\n[2/2] Restoring record image URLs...')
  const recordsWithNewImage = await prisma.record.findMany({
    where: {
      imageUrl: { startsWith: `/uploads/users/${DEFAULT_UID}/records/` },
    },
  })
  for (const record of recordsWithNewImage) {
    const oldUrl = record.imageUrl.replace(
      `/uploads/users/${DEFAULT_UID}/records/`,
      '/uploads/records/'
    )
    await prisma.record.update({
      where: { id: record.id },
      data: { imageUrl: oldUrl },
    })
  }
  console.log(`  ✓ Restored ${recordsWithNewImage.length} record image URLs`)

  console.log('\n=== Rollback completed! ===')
  console.log('\nNext steps to fully revert schema:')
  console.log('  1. Revert prisma/schema.prisma (remove User model, ownerUid fields)')
  console.log('  2. Run: npx prisma db push')
}

main()
  .catch((e) => {
    console.error('Rollback failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
