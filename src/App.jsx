import { startTransition, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'
import { buildSajuPrompt } from './sajuPrompt'
import { streamGemini } from './gemini'
import { isSupabaseConfigured, supabase } from './supabase'

const SUPABASE_MISSING_MSG =
  'Supabase 환경변수가 없습니다. .env에 VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY를 넣고 npm run dev를 다시 실행하세요.'

const GENDER_LABEL = { male: '남성', female: '여성' }
const CALENDAR_LABEL = { solar: '양력', lunar: '음력' }

function formatBirthMeta({ birthDate, birthTime, gender, calendarType }) {
  const parts = []
  if (birthDate) parts.push(birthDate.replaceAll('-', '.'))
  if (birthTime) parts.push(birthTime.slice(0, 5))
  if (gender) parts.push(GENDER_LABEL[gender] || gender)
  if (calendarType) parts.push(CALENDAR_LABEL[calendarType] || calendarType)
  return parts
}

function formatRelativeDate(value) {
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

function App() {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('solar')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [readingLoading, setReadingLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [readings, setReadings] = useState([])
  const [activeReadingId, setActiveReadingId] = useState(null)
  const [resultRevealKey, setResultRevealKey] = useState(0)
  const [copyState, setCopyState] = useState('idle')

  const resultRef = useRef(null)
  const formRef = useRef(null)
  const scrolledRef = useRef(false)
  const toastTimerRef = useRef(null)
  const copyTimerRef = useRef(null)

  const busy = loading || saving || readingLoading
  const isSavedView = Boolean(activeReadingId) && !loading && !saving
  const showResultPanel = loading || readingLoading || Boolean(result)
  const metaChips = formatBirthMeta({
    birthDate,
    birthTime,
    gender,
    calendarType,
  })
  const filledCount = [name, birthDate, birthTime, gender].filter(Boolean).length

  const showToast = (message) => {
    setToast(message)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(''), 2600)
  }

  const loadReadings = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setHistoryLoading(false)
      setError(SUPABASE_MISSING_MSG)
      return
    }

    setHistoryLoading(true)
    const { data, error: fetchError } = await supabase
      .from('saju_readings')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error(fetchError)
      setHistoryLoading(false)
      return
    }

    setReadings(data ?? [])
    setHistoryLoading(false)
  }

  useEffect(() => {
    loadReadings()
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if ((loading || result) && resultRef.current && !scrolledRef.current) {
      scrolledRef.current = true
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (!loading && !result) {
      scrolledRef.current = false
    }
  }, [loading, result])

  const saveReading = async (payload) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(SUPABASE_MISSING_MSG)
    }

    const { data, error: saveError } = await supabase
      .from('saju_readings')
      .insert(payload)
      .select('id, name, created_at')
      .single()

    if (saveError) {
      throw saveError
    }

    setReadings((prev) => [data, ...prev])
    setActiveReadingId(data.id)
    return data
  }

  const handleNewReading = () => {
    if (busy) return

    setName('')
    setBirthDate('')
    setBirthTime('')
    setGender('')
    setCalendarType('solar')
    setLoading(false)
    setSaving(false)
    setReadingLoading(false)
    setResult('')
    setError('')
    setFieldErrors({})
    setActiveReadingId(null)
    setCopyState('idle')
    setResultRevealKey((key) => key + 1)
    scrolledRef.current = false

    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      document.getElementById('name')?.focus()
    })
  }

  const handleSelectReading = async (readingId) => {
    if (busy && activeReadingId !== readingId) return

    setError('')
    setFieldErrors({})
    setActiveReadingId(readingId)
    setLoading(false)
    setSaving(false)
    setReadingLoading(true)
    setResult('')
    setCopyState('idle')
    scrolledRef.current = false

    if (!isSupabaseConfigured || !supabase) {
      setReadingLoading(false)
      setError(SUPABASE_MISSING_MSG)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('saju_readings')
      .select('id, name, birth_date, birth_time, gender, calendar_type, result')
      .eq('id', readingId)
      .single()

    if (fetchError) {
      console.error(fetchError)
      setReadingLoading(false)
      setError('저장된 사주를 불러오지 못했습니다.')
      return
    }

    setName(data.name ?? '')
    setBirthDate(data.birth_date ?? '')
    setBirthTime((data.birth_time || '').slice(0, 5))
    setGender(data.gender ?? '')
    setCalendarType(data.calendar_type ?? 'solar')
    setResult(data.result ?? '')
    setResultRevealKey((key) => key + 1)
    setReadingLoading(false)

    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      scrolledRef.current = true
    })
  }

  const validateForm = () => {
    const nextErrors = {
      name: !name.trim(),
      birthDate: !birthDate,
      birthTime: !birthTime,
      gender: !gender,
    }
    setFieldErrors(nextErrors)
    return !Object.values(nextErrors).some(Boolean)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy || isSavedView) return

    setError('')
    setResult('')
    setActiveReadingId(null)
    setCopyState('idle')
    scrolledRef.current = false

    if (!validateForm()) {
      setError('이름, 생년월일, 태어난 시간, 성별을 모두 입력해 주세요.')
      return
    }

    setLoading(true)
    try {
      const prompt = buildSajuPrompt({
        name: name.trim(),
        birthDate,
        birthTime,
        gender,
        calendarType,
      })

      const text = await streamGemini(prompt, (partial) => {
        startTransition(() => {
          setResult(partial)
        })
      })

      if (!text) {
        setResult('결과를 받지 못했습니다.')
        return
      }

      setLoading(false)
      setSaving(true)

      await saveReading({
        name: name.trim(),
        birth_date: birthDate,
        birth_time: birthTime,
        gender,
        calendar_type: calendarType,
        result: text,
      })

      showToast(`${name.trim()}님 사주가 저장되었어요`)
      setResultRevealKey((key) => key + 1)
    } catch (err) {
      console.error(err)
      setError(err.message || '요청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      setSaving(false)
    }
  }

  const handleCopyResult = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopyState('copied')
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopyState('idle'), 1800)
    } catch (err) {
      console.error(err)
      setCopyState('failed')
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopyState('idle'), 1800)
    }
  }

  const submitLabel = loading
    ? 'Reading…'
    : saving
      ? '저장 중…'
      : isSavedView
        ? '저장된 사주 보기'
        : '내 사주 보기'

  return (
    <div className="layout">
      <aside className="sidebar" aria-labelledby="sidebar-title">
        <div className="sidebar-head">
          <div className="sidebar-head-row">
            <p className="sidebar-kicker">HISTORY</p>
            <span className="sidebar-count">{readings.length}</span>
          </div>
          <h2 id="sidebar-title">저장된 사주</h2>
        </div>

        {historyLoading ? (
          <div className="sidebar-loading" aria-hidden="true">
            <div className="sidebar-loading-line" />
            <div className="sidebar-loading-line short" />
            <div className="sidebar-loading-line" />
          </div>
        ) : readings.length === 0 ? (
          <p className="sidebar-empty">
            아직 저장된 이름이 없어요.
            <span>첫 사주를 만들면 여기에 쌓여요.</span>
          </p>
        ) : (
          <ul className="sidebar-list">
            {readings.map((reading) => (
              <li key={reading.id}>
                <button
                  type="button"
                  className={
                    activeReadingId === reading.id
                      ? 'sidebar-item is-active'
                      : 'sidebar-item'
                  }
                  onClick={() => handleSelectReading(reading.id)}
                  disabled={busy && activeReadingId !== reading.id}
                >
                  <span className="sidebar-item-name">{reading.name}</span>
                  <span className="sidebar-item-date">
                    {formatRelativeDate(reading.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="sidebar-new"
          onClick={handleNewReading}
          disabled={busy}
        >
          새 사주 만들기
        </button>
      </aside>

      <div className="page">
        <header className="hero">
          <div className="hero-top">
            <span className="badge">SAJU ME</span>
            <span className="badge-dot" aria-hidden="true" />
          </div>
          <p className="brand">사주미</p>
          <h1 className="headline">
            오늘의 나를
            <br />
            <span className="headline-accent">더 선명하게</span>
          </h1>
          <p className="lede">생년월일만 넣으면, AI가 성격·기질·재능을 바로 읽어드려요.</p>
        </header>

        <main className="main">
          <section className="panel" aria-labelledby="form-title" ref={formRef}>
            <div className="panel-head">
              <div className="panel-head-copy">
                <h2 id="form-title">{isSavedView ? 'Saved' : 'Start'}</h2>
                <p>
                  {isSavedView
                    ? '저장된 사주를 보고 있어요. 새로 보려면 아래 버튼을 눌러주세요.'
                    : `기본 정보 ${filledCount}/4 · 입력하면 해석이 시작돼요.`}
                </p>
              </div>
              {(activeReadingId || result || name) && (
                <button
                  type="button"
                  className="new-reading"
                  onClick={handleNewReading}
                  disabled={busy}
                >
                  새 사주 만들기
                </button>
              )}
            </div>

            {isSavedView && (
              <div className="saved-banner" role="status">
                <div>
                  <p className="saved-banner-title">{name}님 사주</p>
                  <p className="saved-banner-text">
                    입력값은 참고용으로 잠겨 있어요. 새 해석은 새 사주 만들기로 시작하세요.
                  </p>
                </div>
                <button
                  type="button"
                  className="saved-banner-action"
                  onClick={handleNewReading}
                >
                  새로 시작
                </button>
              </div>
            )}

            {!isSavedView && (
              <div
                className="progress"
                aria-hidden="true"
                style={{ '--progress': `${(filledCount / 4) * 100}%` }}
              />
            )}

            <form className="form" onSubmit={handleSubmit}>
              <div className={`field ${fieldErrors.name ? 'has-error' : ''}`}>
                <label htmlFor="name">이름</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (fieldErrors.name) {
                      setFieldErrors((prev) => ({ ...prev, name: false }))
                    }
                  }}
                  placeholder="이름을 입력하세요"
                  autoComplete="name"
                  disabled={isSavedView || busy}
                />
              </div>

              <div className="row">
                <div className={`field ${fieldErrors.birthDate ? 'has-error' : ''}`}>
                  <label htmlFor="birthDate">생년월일</label>
                  <input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value)
                      if (fieldErrors.birthDate) {
                        setFieldErrors((prev) => ({ ...prev, birthDate: false }))
                      }
                    }}
                    disabled={isSavedView || busy}
                  />
                </div>

                <div className={`field ${fieldErrors.birthTime ? 'has-error' : ''}`}>
                  <label htmlFor="birthTime">태어난 시간</label>
                  <input
                    id="birthTime"
                    type="time"
                    value={birthTime}
                    onChange={(e) => {
                      setBirthTime(e.target.value)
                      if (fieldErrors.birthTime) {
                        setFieldErrors((prev) => ({ ...prev, birthTime: false }))
                      }
                    }}
                    disabled={isSavedView || busy}
                  />
                </div>
              </div>

              <fieldset
                className={`field choice ${fieldErrors.gender ? 'has-error' : ''}`}
                disabled={isSavedView || busy}
              >
                <legend>성별</legend>
                <div className="choice-group" role="presentation">
                  <label className={gender === 'male' ? 'chip is-on' : 'chip'}>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={gender === 'male'}
                      onChange={(e) => {
                        setGender(e.target.value)
                        if (fieldErrors.gender) {
                          setFieldErrors((prev) => ({ ...prev, gender: false }))
                        }
                      }}
                    />
                    남성
                  </label>
                  <label className={gender === 'female' ? 'chip is-on' : 'chip'}>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={gender === 'female'}
                      onChange={(e) => {
                        setGender(e.target.value)
                        if (fieldErrors.gender) {
                          setFieldErrors((prev) => ({ ...prev, gender: false }))
                        }
                      }}
                    />
                    여성
                  </label>
                </div>
              </fieldset>

              <fieldset className="field choice" disabled={isSavedView || busy}>
                <legend>달력</legend>
                <div className="choice-group" role="presentation">
                  <label className={calendarType === 'solar' ? 'chip is-on' : 'chip'}>
                    <input
                      type="radio"
                      name="calendarType"
                      value="solar"
                      checked={calendarType === 'solar'}
                      onChange={(e) => setCalendarType(e.target.value)}
                    />
                    양력
                  </label>
                  <label className={calendarType === 'lunar' ? 'chip is-on' : 'chip'}>
                    <input
                      type="radio"
                      name="calendarType"
                      value="lunar"
                      checked={calendarType === 'lunar'}
                      onChange={(e) => setCalendarType(e.target.value)}
                    />
                    음력
                  </label>
                </div>
              </fieldset>

              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}

              {isSavedView ? (
                <button
                  type="button"
                  className="submit is-secondary"
                  onClick={handleNewReading}
                >
                  <span>새 사주로 시작하기</span>
                  <span className="submit-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              ) : (
                <button type="submit" className="submit" disabled={busy}>
                  <span>{submitLabel}</span>
                  <span className="submit-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              )}
            </form>
          </section>

          {showResultPanel && (
            <section
              className={[
                'result',
                loading ? 'is-streaming' : '',
                saving ? 'is-saving' : '',
                isSavedView ? 'is-saved' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              ref={resultRef}
              aria-labelledby="result-title"
              aria-busy={loading || readingLoading || saving}
            >
              <div className="result-head">
                <div className="result-head-row">
                  <p className="result-kicker">
                    {isSavedView ? 'SAVED FOR' : 'FOR'} {name || 'YOU'}
                  </p>
                  {isSavedView && <span className="result-badge">저장됨</span>}
                  {saving && <span className="result-badge is-saving">저장 중</span>}
                </div>
                <h2 id="result-title">기본 차트 해석</h2>
                {metaChips.length > 0 && (
                  <ul className="result-meta" aria-label="입력 정보">
                    {metaChips.map((chip) => (
                      <li key={chip}>{chip}</li>
                    ))}
                  </ul>
                )}
                {loading && (
                  <p className="stream-status" aria-live="polite">
                    {result ? '실시간으로 작성 중…' : '명식을 준비하는 중…'}
                  </p>
                )}
                {saving && (
                  <p className="stream-status" aria-live="polite">
                    해석을 저장하는 중…
                  </p>
                )}
                {readingLoading && (
                  <p className="stream-status" aria-live="polite">
                    저장된 해석을 불러오는 중…
                  </p>
                )}
              </div>

              <div className="result-body" key={resultRevealKey}>
                {(loading || readingLoading) && !result && <ResultSkeleton />}

                {result && (
                  <div className={`prose ${isSavedView ? 'is-reveal' : ''}`}>
                    <ReactMarkdown>{result}</ReactMarkdown>
                    {loading && <span className="caret" aria-hidden="true" />}
                  </div>
                )}
              </div>

              {result && !loading && !readingLoading && (
                <div className="result-actions">
                  <button
                    type="button"
                    className="result-action"
                    onClick={handleCopyResult}
                  >
                    {copyState === 'copied'
                      ? '복사됨'
                      : copyState === 'failed'
                        ? '복사 실패'
                        : '결과 복사'}
                  </button>
                  <button
                    type="button"
                    className="result-action is-primary"
                    onClick={handleNewReading}
                    disabled={busy}
                  >
                    새 사주 만들기
                  </button>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  )
}

export default App

//saju-me@260812
