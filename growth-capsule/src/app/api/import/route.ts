import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { parseAllDayOneExports, dayOneEntryToRecord, copyDiaryImage } from '@/lib/dayone-parser'
import { getCurrentUid, checkOwnership } from '@/lib/auth'

const EXPORT_DIR = process.env.DAYONE_EXPORT_PATH || '/Users/keyan/Downloads/growth-capsule-dev/导出的日记'

export async function GET(request: NextRequest) {
  try {
    // Scan available Day One exports
    const results = await parseAllDayOneExports(EXPORT_DIR)

    // Group entries by tags (child names)
    const entriesByTag = new Map<string, any[]>()
    let untaggedCount = 0

    for (const result of results) {
      for (const entry of result.entries) {
        if (entry.tags.length === 0) {
          untaggedCount++
          // Also add to a special "未分类" group
          if (!entriesByTag.has('未分类')) {
            entriesByTag.set('未分类', [])
          }
          entriesByTag.get('未分类')!.push({
            date: entry.date,
            time: entry.time,
            location: entry.location,
            weather: entry.weather,
            content: entry.content,
            tags: entry.tags,
            title: entry.title,
            images: entry.images,
            sourceDir: entry.sourceDir,
          })
        } else {
          for (const tag of entry.tags) {
            if (!entriesByTag.has(tag)) {
              entriesByTag.set(tag, [])
            }
            entriesByTag.get(tag)!.push({
              date: entry.date,
              time: entry.time,
              location: entry.location,
              weather: entry.weather,
              content: entry.content,
              tags: entry.tags,
              title: entry.title,
              images: entry.images,
              sourceDir: entry.sourceDir,
            })
          }
        }
      }
    }

    // Convert map to array with date ranges
    const grouped = Array.from(entriesByTag.entries()).map(([tag, entries]) => {
      const dates = entries.map(e => new Date(e.date).getTime()).filter(d => !isNaN(d))
      return {
        tag,
        count: entries.length,
        dateRange: {
          start: dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : null,
          end: dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null,
        },
      }
    })

    // Sort: tagged groups first, then by count
    grouped.sort((a, b) => {
      if (a.tag === '未分类') return 1
      if (b.tag === '未分类') return -1
      return b.count - a.count
    })

    // Total entries across all files
    const totalEntries = results.reduce((sum, r) => sum + r.entries.length, 0)

    return NextResponse.json({
      success: true,
      data: {
        exportDirectory: EXPORT_DIR,
        totalExports: results.length,
        totalEntries,
        groupedByTag: grouped,
      },
    })
  } catch (error) {
    console.error('Failed to scan Day One exports:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scan exports',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const uid = getCurrentUid(request)
    const body = await request.json()
    const { childId, tagName } = body

    if (!childId || !tagName) {
      return NextResponse.json(
        { success: false, error: 'Missing childId or tagName' },
        { status: 400 }
      )
    }

    // Verify child exists and belongs to current user
    const child = await prisma.child.findUnique({
      where: { id: childId },
    })

    if (!child) {
      return NextResponse.json(
        { success: false, error: 'Child not found' },
        { status: 404 }
      )
    }

    // Ownership check
    const denied = checkOwnership(child.ownerUid, uid)
    if (denied) return denied

    // Parse Day One exports
    const results = await parseAllDayOneExports(EXPORT_DIR)

    // Filter entries by tag (or untagged for "未分类")
    const entriesToImport: any[] = []
    for (const result of results) {
      for (const entry of result.entries) {
        if (tagName === '未分类') {
          if (entry.tags.length === 0) {
            entriesToImport.push(entry)
          }
        } else if (entry.tags.includes(tagName)) {
          entriesToImport.push(entry)
        }
      }
    }

    if (entriesToImport.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No entries found with tag "${tagName}"`,
      })
    }

    // Import entries one by one
    let imported = 0
    let skipped = 0
    let imagesImported = 0

    for (const entry of entriesToImport) {
      // Check if entry already exists (by date and first 100 chars of content)
      const behaviorPrefix = entry.content.substring(0, 100)
      const existing = await prisma.record.findFirst({
        where: {
          childId,
          ownerUid: uid,
          date: entry.date,
          behavior: {
            startsWith: behaviorPrefix,
          },
        },
      })

      if (existing) {
        skipped++
        continue
      }

      // Calculate age in months at the time of the record
      const entryDate = new Date(entry.date)
      const birthDate = new Date(child.birthDate)
      const ageInMonths = Math.max(0, Math.floor(
        (entryDate.getTime() - birthDate.getTime()) /
          (1000 * 60 * 60 * 24 * 30.44)
      ))

      // Convert to record format
      const recordData = dayOneEntryToRecord(entry, childId)

      // Handle image: copy first image from diary export
      let imageUrl: string | null = null
      if (entry.images && entry.images.length > 0) {
        const firstImage = entry.images[0]
        imageUrl = await copyDiaryImage(
          entry.sourceDir,
          firstImage,
          process.cwd()
        )
        if (imageUrl) {
          imagesImported++
        }
      }

      // Create record (with ownerUid)
      await prisma.record.create({
        data: {
          childId,
          date: entryDate,
          behavior: recordData.behavior,
          category: recordData.category,
          notes: recordData.notes,
          imageUrl,
          ageInMonths,
          ownerUid: uid,
        },
      })

      imported++
    }

    return NextResponse.json({
      success: true,
      data: {
        imported,
        skipped,
        imagesImported,
        total: entriesToImport.length,
        childName: child.name,
        tag: tagName,
      },
    })
  } catch (error) {
    console.error('Failed to import entries:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import entries',
      },
      { status: 500 }
    )
  }
}
