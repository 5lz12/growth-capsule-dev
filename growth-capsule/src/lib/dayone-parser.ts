import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export interface DayOneEntry {
  date: Date
  time: string
  location?: string
  weather?: string
  tags: string[]
  content: string
  images: string[]
}

export interface ParsedDayOneFile {
  year: string
  entries: DayOneEntry[]
  imageFiles: string[]
}

/**
 * Parse Day One markdown file exported from Day One app
 */
export async function parseDayOneFile(filePath: string): Promise<ParsedDayOneFile> {
  const content = await readFile(filePath, 'utf-8')
  const entries: DayOneEntry[] = []

  // Split by "---" separator
  const rawEntries = content.split('\n---\n')

  for (const rawEntry of rawEntries) {
    const entry = parseEntry(rawEntry)
    if (entry) {
      entries.push(entry)
    }
  }

  // Extract year from filename or first entry
  const year = entries.length > 0
    ? String(entries[0].date.getFullYear())
    : 'unknown'

  return {
    year,
    entries,
    imageFiles: [], // Will be populated separately
  }
}

/**
 * Parse a single diary entry
 */
function parseEntry(rawEntry: string): DayOneEntry | null {
  const lines = rawEntry.trim().split('\n')
  if (lines.length === 0) return null

  let date: Date | null = null
  let time = ''
  let location: string | undefined
  let weather: string | undefined
  const tags: string[] = []
  const contentLines: string[] = []
  let inContent = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Parse date/time
    if (line.startsWith('时间：')) {
      const match = line.match(/时间：(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/)
      if (match) {
        date = new Date(match[1])
        time = match[1]
      }
      continue
    }

    // Parse location
    if (line.startsWith('地点：')) {
      location = line.replace('地点：', '').trim()
      continue
    }

    // Parse weather
    if (line.startsWith('天气：')) {
      weather = line.replace('天气：', '').trim()
      continue
    }

    // Parse tags
    if (line.startsWith('标签:')) {
      const tagMatch = line.match(/标签:\s*`([^`]+)`\s*/g)
      if (tagMatch) {
        for (const tag of tagMatch) {
          const tagName = tag.match(/`([^`]+)`/)?.[1]
          if (tagName) {
            tags.push(tagName)
          }
        }
      }
      continue
    }

    // Content starts after metadata
    if (line.length > 0 && !line.startsWith('#') && !line.startsWith('时间') && !line.startsWith('地点') && !line.startsWith('天气') && !line.startsWith('标签')) {
      inContent = true
    }

    if (inContent && line.length > 0) {
      contentLines.push(lines[i]) // Preserve original formatting
    }
  }

  if (!date) {
    return null
  }

  const content = contentLines.join('\n').trim()

  return {
    date,
    time,
    location,
    weather,
    tags,
    content,
    images: [], // Will be populated by matching image files
  }
}

/**
 * Scan directory for Day One export files
 */
export async function scanDayOneExports(basePath: string): Promise<string[]> {
  const entries = await readdir(basePath, { withFileTypes: true })
  const exportFiles: string[] = []

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.includes('OneDiary')) {
      const mdFile = join(basePath, entry.name, `${entry.name}.md`)
      exportFiles.push(mdFile)
    }
  }

  return exportFiles
}

/**
 * Parse all Day One export files in a directory
 */
export async function parseAllDayOneExports(basePath: string): Promise<ParsedDayOneFile[]> {
  const exportFiles = await scanDayOneExports(basePath)
  const results: ParsedDayOneFile[] = []

  for (const filePath of exportFiles) {
    try {
      const parsed = await parseDayOneFile(filePath)
      results.push(parsed)
    } catch (error) {
      console.error(`Failed to parse ${filePath}:`, error)
    }
  }

  return results.sort((a, b) => a.year.localeCompare(b.year))
}

/**
 * Get image files from a Day One export directory
 */
export async function getImageFiles(exportDirPath: string): Promise<string[]> {
  const entries = await readdir(exportDirPath, { withFileTypes: true })
  const imageFiles: string[] = []

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

  for (const entry of entries) {
    if (entry.isFile()) {
      const ext = entry.name.toLowerCase().substring(entry.name.lastIndexOf('.'))
      if (imageExtensions.includes(ext)) {
        imageFiles.push(join(exportDirPath, entry.name))
      }
    }
  }

  return imageFiles
}

/**
 * Convert Day One entry to child record format
 */
export function dayOneEntryToRecord(
  entry: DayOneEntry,
  childId: string
): {
  date: Date
  behavior: string
  category?: string
  analysis?: string
  imageUrl?: string
} {
  // Create behavior text from content, truncate if too long
  const behavior = entry.content.length > 500
    ? entry.content.substring(0, 500) + '...'
    : entry.content

  // Try to infer category from tags or content (basic implementation)
  let category: string | undefined
  const contentLower = entry.content.toLowerCase()

  const keywords = {
    motor: ['走', '跑', '爬', '跳', '运动', '抓', '拿'],
    language: ['说', '叫', '话', '词', '语', '言', '说'],
    social: ['朋友', '玩', '分享', '一起', '别人', '互动'],
    cognitive: ['问', '为什么', '想', '思考', '认', '知道'],
    emotional: ['哭', '笑', '生气', '开心', '害怕', '情绪'],
  }

  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(word => contentLower.includes(word))) {
      category = cat
      break
    }
  }

  return {
    date: entry.date,
    behavior,
    category,
    // Note: Images will need to be uploaded separately and URL added here
  }
}
