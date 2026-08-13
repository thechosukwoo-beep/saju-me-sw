const SHARE_PATH = '/result'
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function getShareUrl(readingId) {
  const origin = window.location.origin
  return `${origin}${SHARE_PATH}/${readingId}`
}

export function getSharePath(pathname = window.location.pathname) {
  const match = String(pathname).match(/^\/result\/([^/]+)\/?$/)
  if (!match) return null
  const id = decodeURIComponent(match[1])
  return UUID_RE.test(id) ? id : null
}

export function shareButtonLabel(shareState) {
  if (shareState === 'copied') return '링크 복사됨'
  if (shareState === 'shared') return '공유됨'
  if (shareState === 'failed') return '공유 실패'
  return '공유'
}

export async function shareReading({ name, url }) {
  const title = name ? `${name}님의 사주 결과 | 사주미` : '사주 결과 | 사주미'
  const text = name
    ? `${name}님의 사주 해석을 확인해 보세요.`
    : '사주 해석을 확인해 보세요.'
  const shareData = { title, text, url }

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(shareData)
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }

  await navigator.clipboard.writeText(url)
  return 'copied'
}
