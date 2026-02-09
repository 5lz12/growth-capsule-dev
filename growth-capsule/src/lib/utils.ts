/**
 * 将月龄转换为"X岁Y个月"的格式
 * @param ageInMonths 月龄
 * @returns 格式化的年龄字符串，如"3岁6个月"
 */
export function formatAge(ageInMonths: number): string {
  const years = Math.floor(ageInMonths / 12)
  const months = ageInMonths % 12

  if (years === 0) {
    return `${months}个月`
  }

  if (years === 1) {
    // 1岁阶段仍显示月数，便于精确观察发展
    if (months === 0) return '1岁'
    return `1岁${months}个月`
  }

  // 超过2岁只显示X岁
  return `${years}岁`
}

/**
 * 将月龄转换为描述性文本，用于AI分析中
 * @param ageInMonths 月龄
 * @returns 格式化的年龄描述，如"3岁6个月大的孩子"
 */
export function formatAgeDescription(ageInMonths: number): string {
  const years = Math.floor(ageInMonths / 12)
  const months = ageInMonths % 12

  if (years === 0) {
    return `${months}个月大的孩子`
  }

  if (months === 0) {
    return `${years}岁的孩子`
  }

  return `${years}岁${months}个月大的孩子`
}

/**
 * 根据月龄返回准确的发展阶段标签
 * @param ageInMonths 月龄
 * @returns 发展阶段标签，如 "学龄初期/小学低年级（6-9岁）"
 */
export function getDevelopmentStageLabel(ageInMonths: number): string {
  if (ageInMonths <= 3) return '新生儿期（0-3个月）'
  if (ageInMonths <= 6) return '婴儿早期（3-6个月）'
  if (ageInMonths <= 12) return '婴儿晚期（6-12个月）'
  if (ageInMonths <= 24) return '幼儿早期（12-24个月）'
  if (ageInMonths <= 36) return '幼儿晚期（24-36个月）'
  if (ageInMonths <= 72) return '学龄前期（3-6岁）'
  if (ageInMonths <= 108) return '学龄初期/小学低年级（6-9岁）'
  if (ageInMonths <= 144) return '学龄中期/小学高年级（9-12岁）'
  return '青少年期（12岁以上）'
}
