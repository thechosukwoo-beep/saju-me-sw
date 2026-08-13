import { CALENDAR_LABEL, GENDER_LABEL } from './constants'

export function formatBirthMeta({
  birthDate,
  birthTime,
  birthTimeUnknown,
  gender,
  calendarType,
}) {
  const parts = []
  if (birthDate) parts.push(String(birthDate).replaceAll('-', '.'))
  if (birthTimeUnknown) parts.push('시간 모름')
  else if (birthTime) parts.push(String(birthTime).slice(0, 5))
  if (gender) parts.push(GENDER_LABEL[gender] || gender)
  if (calendarType) parts.push(CALENDAR_LABEL[calendarType] || calendarType)
  return parts
}

export function formatRelativeDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayDiff = Math.round((startOfToday - startOfTarget) / 86400000)

  if (dayDiff === 0) return '오늘'
  if (dayDiff === 1) return '어제'
  if (dayDiff < 7) return `${dayDiff}일 전`

  return `${date.getMonth() + 1}.${date.getDate()}`
}
