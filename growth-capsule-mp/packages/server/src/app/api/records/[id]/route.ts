import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import prisma from '@/lib/prisma'
import { analyzerManager } from '@/lib/analyzers/analyzer-manager'
import { getCurrentUid, checkOwnership, getUserUploadDir, getUserUploadUrl } from '@/lib/auth'

/**
 * PUT /api/records/[id]
 * 更新记录（支持图片上传和删除，含权限校验）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const uid = getCurrentUid(request)

    const record = await prisma.record.findUnique({
      where: { id: params.id },
      include: { child: true },
    })

    if (!record) {
      return NextResponse.json({
        success: false,
        error: 'Record not found',
      }, { status: 404 })
    }

    // Ownership check (via record's ownerUid)
    const denied = checkOwnership(record.ownerUid, uid)
    if (denied) return denied

    const formData = await request.formData()
    const category = formData.get('category') as string
    const behavior = formData.get('behavior') as string
    const date = formData.get('date') as string
    const notes = formData.get('notes') as string
    const removeImage = formData.get('removeImage') === 'true'
    const imageFile = formData.get('image') as File | null

    if (!category || !behavior || !date) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
      }, { status: 400 })
    }

    // 计算月龄
    const recordDate = new Date(date)
    const birthDate = new Date(record.child.birthDate)
    const ageInMonths = Math.floor(
      (recordDate.getTime() - birthDate.getTime()) /
        (1000 * 60 * 60 * 24 * 30.44)
    )

    // 处理图片
    let imageUrl = record.imageUrl

    // 如果要删除图片
    if (removeImage && record.imageUrl) {
      try {
        const oldImagePath = join(process.cwd(), 'public', record.imageUrl)
        await unlink(oldImagePath)
      } catch (error) {
        console.error('Failed to delete old image:', error)
      }
      imageUrl = null
    }

    // 如果上传了新图片
    if (imageFile) {
      // 删除旧图片文件（如果存在）
      if (record.imageUrl) {
        try {
          const oldImagePath = join(process.cwd(), 'public', record.imageUrl)
          await unlink(oldImagePath)
        } catch (error) {
          console.error('Failed to delete old image:', error)
        }
      }

      // 确保上传目录存在（用户命名空间）
      const uploadDir = getUserUploadDir(uid, 'records')
      await mkdir(uploadDir, { recursive: true })

      // 保存新图片
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const filename = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`
      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)

      imageUrl = getUserUploadUrl(uid, 'records', filename)
    }

    // 重新生成分析
    const analysisResult = await analyzerManager.analyze({
      childAge: ageInMonths,
      behavior,
      context: notes,
      category,
    })

    const structuredAnalysis = JSON.stringify(analysisResult)

    // 更新记录
    const updatedRecord = await prisma.record.update({
      where: { id: params.id },
      data: {
        category,
        behavior,
        date: recordDate,
        ageInMonths,
        notes,
        analysis: structuredAnalysis,
        milestones: analysisResult.milestone,
        imageUrl,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        record: updatedRecord,
        analysisSource: analysisResult.source,
      },
    })
  } catch (error) {
    console.error('Error updating record:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update record',
    }, { status: 500 })
  }
}

/**
 * DELETE /api/records/[id]
 * 删除记录（含权限校验）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const uid = getCurrentUid(request)

    const record = await prisma.record.findUnique({
      where: { id: params.id },
    })

    if (!record) {
      return NextResponse.json({
        success: false,
        error: 'Record not found',
      }, { status: 404 })
    }

    // Ownership check
    const denied = checkOwnership(record.ownerUid, uid)
    if (denied) return denied

    // 删除图片文件（如果存在）
    if (record.imageUrl) {
      try {
        const imagePath = join(process.cwd(), 'public', record.imageUrl)
        await unlink(imagePath)
      } catch (error) {
        console.error('Failed to delete image:', error)
      }
    }

    // 删除记录
    await prisma.record.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      data: { id: params.id },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete record',
    }, { status: 500 })
  }
}
