import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getCurrentUid, getUserUploadDir, getUserUploadUrl } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const uid = getCurrentUid(request)

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 生成唯一文件名
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${timestamp}-${random}.${extension}`

    // 确保上传目录存在（用户命名空间）
    const uploadDir = getUserUploadDir(uid, 'records')
    await mkdir(uploadDir, { recursive: true })
    const filepath = path.join(uploadDir, filename)

    // 写入文件
    await writeFile(filepath, buffer)

    // 返回文件URL
    const url = getUserUploadUrl(uid, 'records', filename)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: `Failed to upload file: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
