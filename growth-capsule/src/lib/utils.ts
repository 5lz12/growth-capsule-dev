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

  if (months === 0) {
    return `${years}岁`
  }

  return `${years}岁${months}个月`
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
