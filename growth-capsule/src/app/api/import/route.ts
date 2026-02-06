import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { parseAllDayOneExports, dayOneEntryToRecord } from '@/lib/dayone-parser'

const EXPORT_DIR = process.env.DAYONE_EXPORT_PATH || '/Users/keyan/growth-capsule-dev/导出的日记'

export async function GET() {
  try {
    // Scan available Day One exports
    const results = await parseAllDayOneExports(EXPORT_DIR)

    // Group entries by tags (child names)
    const entriesByTag = new Map<string, any[]>()

    for (const result of results) {
      for (const entry of result.entries) {
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
          })
        }
      }
    }

    // Convert map to array
    const grouped = Array.from(entriesByTag.entries()).map(([tag, entries]) => ({
      tag,
      count: entries.length,
      dateRange: {
        start: entries[0]?.date,
        end: entries[entries.length - 1]?.date,
      },
    }))

    return NextResponse.json({
      success: true,
      data: {
        exportDirectory: EXPORT_DIR,
        totalExports: results.length,
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
    const body = await request.json()
    const { childId, tagName } = body

    if (!childId || !tagName) {
      return NextResponse.json(
        { success: false, error: 'Missing childId or tagName' },
        { status: 400 }
      )
    }

    // Verify child exists
    const child = await prisma.child.findUnique({
      where: { id: childId },
    })

    if (!child) {
      return NextResponse.json(
        { success: false, error: 'Child not found' },
        { status: 404 }
      )
    }

    // Parse Day One exports
    const results = await parseAllDayOneExports(EXPORT_DIR)

    // Filter entries by tag
    const entriesToImport: any[] = []
    for (const result of results) {
      for (const entry of result.entries) {
        if (entry.tags.includes(tagName)) {
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

    // Import entries
    let imported = 0
    let skipped = 0

    for (const entry of entriesToImport) {
      // Check if entry already exists
      const existing = await prisma.record.findFirst({
        where: {
          childId,
          date: entry.date,
          behavior: entry.content.substring(0, 200), // Check by first 200 chars
        },
      })

      if (existing) {
        skipped++
        continue
      }

      // Calculate age in months at the time of the record
      const ageInMonths = Math.floor(
        (entry.date.getTime() - new Date(child.birthDate).getTime()) /
          (1000 * 60 * 60 * 24 * 30.44)
      )

      // Convert to record format
      const recordData = dayOneEntryToRecord(entry, childId)

      // Create record
      await prisma.record.create({
        data: {
          childId,
          date: recordData.date,
          behavior: recordData.behavior,
          category: recordData.category as any,
          analysis: recordData.analysis,
          imageUrl: recordData.imageUrl,
          ageInMonths,
        },
      })

      imported++
    }

    return NextResponse.json({
      success: true,
      data: {
        imported,
        skipped,
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
