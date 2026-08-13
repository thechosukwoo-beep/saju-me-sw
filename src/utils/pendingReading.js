export const PENDING_READING_KEY = 'saju_pending_guest_reading'

export function readPendingGuestReading() {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(PENDING_READING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.result || typeof parsed.result !== 'string') return null
    if (!parsed.formValues || typeof parsed.formValues !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

export function writePendingGuestReading({ formValues, result }) {
  if (typeof sessionStorage === 'undefined' || !result) return
  sessionStorage.setItem(
    PENDING_READING_KEY,
    JSON.stringify({ formValues, result }),
  )
}

export function clearPendingGuestReading() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(PENDING_READING_KEY)
}
