export function readOAuthErrorFromUrl() {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const error =
    search.get('error') ||
    search.get('error_code') ||
    hash.get('error') ||
    hash.get('error_code')
  if (!error) return ''

  const description =
    search.get('error_description') || hash.get('error_description') || ''
  return decodeURIComponent((description || error).replace(/\+/g, ' '))
}

export function clearAuthParamsFromUrl() {
  const url = new URL(window.location.href)
  const keys = ['error', 'error_code', 'error_description', 'code', 'state']
  let changed = false
  for (const key of keys) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key)
      changed = true
    }
  }
  if (url.hash && /error|code|state/.test(url.hash)) {
    url.hash = ''
    changed = true
  }
  if (changed) {
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}`)
  }
}

export function formatAuthError(message) {
  const text = String(message || '')
  if (!text) return '로그인 중 오류가 발생했습니다.'
  if (/redirect_uri_mismatch/i.test(text)) {
    return 'Google OAuth Redirect URI가 맞지 않습니다. Google Cloud에 Supabase callback URL을 등록했는지 확인하세요.'
  }
  if (/oauth.*state|state parameter/i.test(text)) {
    return '로그인 세션이 만료되었거나 중단되었습니다. Google 로그인을 다시 시도해 주세요.'
  }
  if (/provider is not enabled|unsupported provider/i.test(text)) {
    return 'Supabase에서 Google provider가 아직 활성화되지 않았습니다.'
  }
  if (/access_denied/i.test(text)) {
    return 'Google 로그인이 취소되었습니다.'
  }
  return text
}
