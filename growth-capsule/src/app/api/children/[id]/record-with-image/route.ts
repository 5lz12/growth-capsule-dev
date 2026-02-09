import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import prisma from '@/lib/prisma'
import { analyzerManager } from '@/lib/analyzers/analyzer-manager'
import { formatAge, getDevelopmentStageLabel } from '@/lib/utils'
import { getCurrentUid, checkOwnership, getUserUploadDir, getUserUploadUrl } from '@/lib/auth'

/**
 * 保存上传的图片文件到用户命名空间目录
 */
async function saveImageFile(file: File, ownerUid: string): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '')
  const filename = `${timestamp}-${safeName}`

  const uploadDir = getUserUploadDir(ownerUid, 'records')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), buffer)

  return getUserUploadUrl(ownerUid, 'records', filename)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const uid = getCurrentUid(request)

    // 支持 JSON 和 FormData 两种格式
    let category: string, behavior: string, date: string, notes: string | undefined, imageUrl: string | undefined

    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await request.json()
      category = body.category
      behavior = body.behavior
      date = body.date
      notes = body.notes
      imageUrl = body.imageUrl
    } else {
      // FormData 格式（包含图片文件）
      const fd = await request.formData()
      category = fd.get('category') as string
      behavior = fd.get('behavior') as string
      date = fd.get('date') as string
      notes = fd.get('notes') as string || undefined
      imageUrl = fd.get('imageUrl') as string || undefined

      // 如果 FormData 中包含图片文件，先保存
      const file = fd.get('file') as File | null
      if (file && file.size > 0) {
        imageUrl = await saveImageFile(file, uid)
      }
    }

    if (!category || !behavior || !date) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 获取孩子信息
    const child = await prisma.child.findUnique({
      where: { id: params.id },
    })

    if (!child) {
      return NextResponse.json(
        { error: '孩子不存在' },
        { status: 404 }
      )
    }

    // Ownership check
    const denied = checkOwnership(child.ownerUid, uid)
    if (denied) return denied

    // 计算月龄
    const recordDate = new Date(date)
    const birthDate = new Date(child.birthDate)
    const ageInMonths = Math.floor(
      (recordDate.getTime() - birthDate.getTime()) /
        (1000 * 60 * 60 * 24 * 30.44)
    )

    // 使用分析器生成分析
    const analysisResult = await analyzerManager.analyze({
      childAge: ageInMonths,
      behavior,
      context: notes,
      category,
      childName: child.name,
      ageDescription: formatAge(ageInMonths),
      developmentStage: getDevelopmentStageLabel(ageInMonths),
    })

    // 保存结构化JSON格式
    const structuredAnalysis = JSON.stringify(analysisResult)

    // 创建记录（绑定 ownerUid）
    const record = await prisma.record.create({
      data: {
        childId: child.id,
        category,
        behavior,
        date: recordDate,
        ageInMonths,
        notes,
        analysis: structuredAnalysis,
        milestones: analysisResult.milestone,
        imageUrl,
        ownerUid: uid,
      },
    })

    return NextResponse.json({ success: true, recordId: record.id })
  } catch (error) {
    console.error('Create record error:', error)
    return NextResponse.json(
      { error: '创建记录失败' },
      { status: 500 }
    )
  }
}
