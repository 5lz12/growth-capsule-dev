import { readdir, readFile, copyFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'

export interface DayOneEntry {
  title: string
  date: Date
  time: string
  location?: string
  weather?: string
  tags: string[]
  content: string
  images: string[] // relative filenames in the export folder
  sourceDir: string // the export directory containing this entry
}

export interface ParsedDayOneFile {
  year: string
  entries: DayOneEntry[]
  imageFiles: string[]
  sourceDir: string
}

/**
 * Parse Day One / OneDiary markdown file
 */
export async function parseDayOneFile(filePath: string): Promise<ParsedDayOneFile> {
  const content = await readFile(filePath, 'utf-8')
  const entries: DayOneEntry[] = []
  const sourceDir = dirname(filePath)

  // Split by "---" separator (handle various newline styles)
  const rawEntries = content.split(/\n---\n/)

  for (const rawEntry of rawEntries) {
    const entry = parseEntry(rawEntry, sourceDir)
    if (entry) {
      entries.push(entry)
    }
  }

  // Get image files in directory
  const imageFiles = await getImageFiles(sourceDir)

  // Extract year from filename or first entry
  const year = entries.length > 0
    ? String(entries[0].date.getFullYear())
    : 'unknown'

  return {
    year,
    entries,
    imageFiles,
    sourceDir,
  }
}

/**
 * Parse a single diary entry
 */
function parseEntry(rawEntry: string, sourceDir: string): DayOneEntry | null {
  const lines = rawEntry.trim().split('\n')
  if (lines.length === 0) return null

  let title = ''
  let date: Date | null = null
  let time = ''
  let location: string | undefined
  let weather: string | undefined
  const tags: string[] = []
  const contentLines: string[] = []
  const images: string[] = []
  let metadataDone = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Parse title (# heading)
    if (line.startsWith('# ') && !title && !metadataDone) {
      title = line.replace(/^#+\s*/, '').trim()
      continue
    }

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
      const loc = line.replace('地点：', '').trim()
      if (loc && loc !== '未知') {
        location = loc
      }
      continue
    }

    // Parse weather
    if (line.startsWith('天气：')) {
      const w = line.replace('天气：', '').trim()
      if (w && w !== '--') {
        weather = w
      }
      continue
    }

    // Parse tags - handle both ` 标签: ` and `标签:` formats
    if (line.match(/^\s*标签:/)) {
      const tagRegex = /`([^`]+)`/g
      let tagMatch: RegExpExecArray | null
      while ((tagMatch = tagRegex.exec(line)) !== null) {
        if (tagMatch[1]) {
          tags.push(tagMatch[1])
        }
      }
      continue
    }

    // Skip empty lines before content starts
    if (!metadataDone && line === '') continue

    // Content starts after metadata
    if (!metadataDone && line.length > 0 && !line.startsWith('时间') && !line.startsWith('地点') && !line.startsWith('天气')) {
      metadataDone = true
    }

    if (metadataDone) {
      // Parse image references: ![Image](filename.jpg) or ![](filename.jpg)
      const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/)
      if (imageMatch) {
        const imagePath = imageMatch[2]
        // Skip dayone-moment:// references (no actual file)
        if (!imagePath.startsWith('dayone-moment://')) {
          images.push(imagePath)
        }
        // Don't add image markdown to content text
        continue
      }

      // Also handle inline # headings within content (sub-titles in diary)
      if (line.startsWith('# ') && metadataDone && !title) {
        // This is actually the title appearing in content body
        title = line.replace(/^#+\s*/, '').trim()
      }

      contentLines.push(lines[i]) // Preserve original formatting
    }
  }

  if (!date) {
    return null
  }

  let content = contentLines.join('\n').trim()

  // Clean up: remove leading # title if it duplicates the title
  if (title && content.startsWith('# ' + title)) {
    content = content.replace('# ' + title, '').trim()
  }

  // If no content but has title, use title as content
  if (!content && title) {
    content = title
  }

  // Skip entries with no useful content
  if (!content || content.length < 2) {
    return null
  }

  return {
    title,
    date,
    time,
    location,
    weather,
    tags,
    content,
    images,
    sourceDir,
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
      if (existsSync(mdFile)) {
        exportFiles.push(mdFile)
      }
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
        imageFiles.push(entry.name)
      }
    }
  }

  return imageFiles
}

/**
 * Copy an image from diary export to public/uploads/records/
 * Returns the public URL path
 */
export async function copyDiaryImage(
  sourceDir: string,
  imageFilename: string,
  destBase: string
): Promise<string | null> {
  try {
    const sourcePath = join(sourceDir, imageFilename)
    if (!existsSync(sourcePath)) {
      console.warn(`Image not found: ${sourcePath}`)
      return null
    }

    const uploadDir = join(destBase, 'public', 'uploads', 'records')
    await mkdir(uploadDir, { recursive: true })

    const destFilename = `import-${Date.now()}-${imageFilename.replace(/[^a-zA-Z0-9._-]/g, '')}`
    const destPath = join(uploadDir, destFilename)

    await copyFile(sourcePath, destPath)
    return `/uploads/records/${destFilename}`
  } catch (error) {
    console.error(`Failed to copy image ${imageFilename}:`, error)
    return null
  }
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
  category: string
  analysis?: string
  imageUrl?: string
  notes?: string
} {
  // Use title + content, or just content
  let behavior = entry.content
  if (behavior.length > 500) {
    behavior = behavior.substring(0, 500) + '...'
  }

  // Try to infer category from tags or content
  let category = 'cognitive' // default
  const contentLower = entry.content.toLowerCase()

  const keywords: Record<string, string[]> = {
    motor: ['走', '跑', '爬', '跳', '运动', '抓', '翻身', '站', '坐', '踢', '球', '跆拳道', '游泳', '骑'],
    language: ['说', '叫', '话', '词', '语', '读', '念', '讲', '问', '英语', '认字'],
    social: ['朋友', '分享', '一起玩', '合作', '交友', '同学', '小朋友', '幼儿园', '学校'],
    cognitive: ['问', '为什么', '想', '思考', '认', '知道', '学习', '围棋', '算', '数', '课'],
    emotional: ['哭', '笑', '生气', '开心', '害怕', '情绪', '难过', '兴奋', '害羞', '心疼', '可怜', '爱'],
  }

  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(word => contentLower.includes(word))) {
      category = cat
      break
    }
  }

  // Build notes from metadata
  const notesParts: string[] = []
  if (entry.title && entry.title !== entry.content.substring(0, entry.title.length)) {
    notesParts.push(`标题：${entry.title}`)
  }
  if (entry.location) notesParts.push(`地点：${entry.location}`)
  if (entry.weather) notesParts.push(`天气：${entry.weather}`)
  if (entry.tags.length > 0) notesParts.push(`标签：${entry.tags.join(', ')}`)

  return {
    date: entry.date,
    behavior,
    category,
    notes: notesParts.length > 0 ? notesParts.join(' · ') : undefined,
  }
}
