export const SUPABASE_MISSING_MSG =
  'Supabase 환경변수가 없습니다. .env에 VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY를 넣고 npm run dev를 다시 실행하세요.'

export const OAUTH_PENDING_KEY = 'saju_oauth_pending'

export const GENDER_LABEL = { male: '남성', female: '여성' }
export const CALENDAR_LABEL = { solar: '양력', lunar: '음력' }

export const GENDER_OPTIONS = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
]

export const CALENDAR_OPTIONS = [
  { value: 'solar', label: '양력' },
  { value: 'lunar', label: '음력' },
]
