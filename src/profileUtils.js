export function composeBirthDate(year, month, day) {
  const y = String(year || '').trim()
  const m = String(month || '').trim()
  const d = String(day || '').trim()
  if (y.length !== 4 || !m || !d) return ''

  const mm = m.padStart(2, '0')
  const dd = d.padStart(2, '0')
  const composed = `${y}-${mm}-${dd}`
  const date = new Date(`${composed}T00:00:00`)
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(y) ||
    date.getMonth() + 1 !== Number(mm) ||
    date.getDate() !== Number(dd)
  ) {
    return ''
  }
  return composed
}

export function splitBirthDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { year: '', month: '', day: '' }
  }
  const [year, month, day] = value.split('-')
  return {
    year,
    month: String(Number(month)),
    day: String(Number(day)),
  }
}

export function digitsOnly(value, maxLength) {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, maxLength)
}

export function profileToFormValues(profile) {
  if (!profile) {
    return {
      name: '',
      birthYear: '',
      birthMonth: '',
      birthDay: '',
      birthTime: '',
      birthTimeUnknown: false,
      gender: 'male',
      calendarType: 'solar',
    }
  }

  const parts = splitBirthDate(profile.birth_date ?? '')
  const timeValue = (profile.birth_time || '').slice(0, 5)
  return {
    name: profile.name ?? '',
    birthYear: parts.year,
    birthMonth: parts.month,
    birthDay: parts.day,
    birthTime: timeValue,
    birthTimeUnknown: !timeValue,
    gender: profile.gender ?? 'male',
    calendarType: profile.calendar_type ?? 'solar',
  }
}
