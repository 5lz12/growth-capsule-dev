import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import prisma from '@/lib/prisma'
import { getCurrentUid, checkOwnership, getUserUploadDir, getUserUploadUrl } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const uid = getCurrentUid(request)
    const childId = params.id

    // Verify child exists and belongs to current user
    const child = await prisma.child.findUnique({ where: { id: childId } })
    if (!child) {
      return NextResponse.json({ error: '孩子不存在' }, { status: 404 })
    }
    const denied = checkOwnership(child.ownerUid, uid)
    if (denied) return denied

    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json(
        { error: '没有找到上传的文件' },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '只支持上传图片文件' },
        { status: 400 }
      )
    }

    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '图片大小不能超过 5MB' },
        { status: 400 }
      )
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${randomString}.${extension}`

    // 确保上传目录存在（用户命名空间）
    const uploadsDir = getUserUploadDir(uid, 'avatars')
    await mkdir(uploadsDir, { recursive: true })

    // 保存文件
    const { join } = require('path')
    const filepath = join(uploadsDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // 更新数据库
    const avatarUrl = getUserUploadUrl(uid, 'avatars', filename)
    await prisma.child.update({
      where: { id: childId },
      data: { avatarUrl },
    })

    return NextResponse.json({ avatarUrl })
  } catch (error) {
    console.error('头像上传失败:', error)
    return NextResponse.json(
      { error: '头像上传失败' },
      { status: 500 }
    )
  }
}
