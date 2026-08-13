import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { isSupabaseConfigured, supabase } from './supabase'
import { getShareUrl, shareButtonLabel, shareReading } from './share'

const GENDER_LABEL = { male: '남성', female: '여성' }
const CALENDAR_LABEL = { solar: '양력', lunar: '음력' }
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function formatBirthMeta({ birthDate, birthTime, birthTimeUnknown, gender, calendarType }) {
  const parts = []
  if (birthDate) parts.push(String(birthDate).replaceAll('-', '.'))
  if (birthTimeUnknown) parts.push('시간 모름')
  else if (birthTime) parts.push(String(birthTime).slice(0, 5))
  if (gender) parts.push(GENDER_LABEL[gender] || gender)
  if (calendarType) parts.push(CALENDAR_LABEL[calendarType] || calendarType)
  return parts
}

function ResultSkeleton() {
  return (
    <div className="skeleton" aria-hidden="true">
      <div className="skeleton-line w-90" />
      <div className="skeleton-line w-75" />
      <div className="skeleton-line w-95" />
      <div className="skeleton-gap" />
      <div className="skeleton-line w-60" />
      <div className="skeleton-line w-85" />
      <div className="skeleton-line w-70" />
      <div className="skeleton-gap" />
      <div className="skeleton-card" />
      <div className="skeleton-card" />
      <div className="skeleton-card short" />
    </div>
  )
}

export default function ResultPage({ readingId }) {
  const [reading, setReading] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareState, setShareState] = useState('idle')
  const [toast, setToast] = useState('')
  const shareTimerRef = useRef(null)
  const toastTimerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!UUID_RE.test(readingId || '')) {
        setReading(null)
        setError('not-found')
        setLoading(false)
        return
      }

      if (!isSupabaseConfigured || !supabase) {
        setError('config')
        setLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await supabase.rpc(
          'get_shared_saju_reading',
          { p_id: readingId },
        )
        if (fetchError) throw fetchError

        const row = Array.isArray(data) ? data[0] : data
        if (!row) {
          if (!cancelled) {
            setReading(null)
            setError('not-found')
          }
          return
        }

        if (!cancelled) {
          setReading(row)
          setError('')
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setReading(null)
          setError(err.message || '결과를 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [readingId])

  useEffect(() => {
    const previous = document.title
    if (reading?.name) {
      document.title = `${reading.name}님의 사주 결과 | 사주미`
    } else if (!loading && error) {
      document.title = '사주 결과를 찾을 수 없어요 | 사주미'
    } else {
      document.title = '공유된 사주 결과 | 사주미'
    }
    return () => {
      document.title = previous
    }
  }, [reading, loading, error])

  const showToast = (message) => {
    setToast(message)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(''), 2600)
  }

  const handleShare = async () => {
    if (!reading?.id) return
    try {
      const outcome = await shareReading({
        name: reading.name,
        url: getShareUrl(reading.id),
      })
      if (outcome === 'cancelled') return
      setShareState(outcome)
      if (outcome === 'copied') showToast('공유 링크를 복사했어요')
      if (outcome === 'shared') showToast('공유했어요')
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current)
      shareTimerRef.current = setTimeout(() => setShareState('idle'), 1800)
    } catch (err) {
      console.error(err)
      setShareState('failed')
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current)
      shareTimerRef.current = setTimeout(() => setShareState('idle'), 1800)
    }
  }

  const birthTime = (reading?.birth_time || '').slice(0, 5)
  const metaChips = reading
    ? formatBirthMeta({
        birthDate: reading.birth_date ?? '',
        birthTime,
        birthTimeUnknown: !birthTime,
        gender: reading.gender ?? '',
        calendarType: reading.calendar_type ?? '',
      })
    : []

  const notFound = error === 'not-found'
  const configError = error === 'config'

  return (
    <div className="share-page">
      <header className="share-top">
        <a className="share-brand" href="/">
          <span className="badge">SAJU ME</span>
          <span className="share-brand-name">사주미</span>
        </a>
        <a className="share-home" href="/">
          내 사주 보러가기
        </a>
      </header>

      {loading ? (
        <section className="result is-saved" aria-labelledby="result-title" aria-busy="true">
          <div className="result-head">
            <div className="result-head-main">
              <p className="result-kicker">SHARED RESULT</p>
              <h2 id="result-title">사주 결과를 불러오는 중</h2>
              <p className="stream-status" aria-live="polite">
                공유된 해석을 열고 있어요…
              </p>
            </div>
            <img
              className="result-mascot is-bounce"
              src="/images/sub-sjrnfl.png"
              alt=""
              width={148}
              height={148}
              decoding="async"
            />
          </div>
          <div className="result-body">
            <ResultSkeleton />
          </div>
        </section>
      ) : reading ? (
        <section className="result is-saved" aria-labelledby="result-title">
          <div className="result-head">
            <div className="result-head-main">
              <div className="result-head-row">
                <p className="result-kicker">SHARED FOR {reading.name || 'YOU'}</p>
                <span className="result-badge">공유됨</span>
              </div>
              <h2 id="result-title">{reading.name}님 사주</h2>
              {metaChips.length > 0 && (
                <ul className="result-meta" aria-label="입력 정보">
                  {metaChips.map((chip) => (
                    <li key={chip}>{chip}</li>
                  ))}
                </ul>
              )}
            </div>
            <img
              className="result-mascot"
              src="/images/sub-sjrnfl.png"
              alt="사주 결과를 전하는 너구리"
              width={148}
              height={148}
              decoding="async"
            />
            <div className="result-mascot-bubble" aria-hidden="true">
              친구가 보낸 사주 결과구리!
            </div>
          </div>

          <div className="result-body">
            <div className="prose is-reveal">
              <ReactMarkdown>{reading.result}</ReactMarkdown>
            </div>
          </div>

          <div className="result-actions">
            <button type="button" className="result-action is-primary" onClick={handleShare}>
              {shareButtonLabel(shareState)}
            </button>
            <a className="result-action" href="/">
              내 사주도 보기
            </a>
          </div>
        </section>
      ) : (
        <section className="result share-empty" aria-labelledby="result-title">
          <div className="result-head">
            <div className="result-head-main">
              <p className="result-kicker">RESULT</p>
              <h2 id="result-title">
                {configError
                  ? '결과를 열 수 없어요'
                  : notFound
                    ? '사주 결과를 찾을 수 없어요'
                    : '결과를 불러오지 못했어요'}
              </h2>
              <p className="share-empty-text">
                {configError
                  ? '서비스 설정이 아직 준비되지 않았어요.'
                  : notFound
                    ? '링크가 잘못되었거나, 삭제된 기록일 수 있어요.'
                    : error || '잠시 후 다시 시도해 주세요.'}
              </p>
            </div>
            <img
              className="result-mascot"
              src="/images/sub-sjrnfl.png"
              alt=""
              width={148}
              height={148}
              decoding="async"
            />
          </div>
          <div className="result-actions">
            <a className="result-action is-primary" href="/">
              사주미로 돌아가기
            </a>
          </div>
        </section>
      )}

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  )
}
