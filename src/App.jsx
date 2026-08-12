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
  const [editMode, setEditMode] = useState(false)
  const [resultRevealKey, setResultRevealKey] = useState(0)
  const [copyState, setCopyState] = useState('idle')

  const resultRef = useRef(null)
  const formRef = useRef(null)
  const scrolledRef = useRef(false)
  const toastTimerRef = useRef(null)
  const copyTimerRef = useRef(null)
  const snapshotRef = useRef(null)

  const busy = loading || saving || readingLoading
  const isSavedView = Boolean(activeReadingId) && !loading && !saving
  const isLocked = isSavedView && !editMode
  const showResultPanel = loading || readingLoading || Boolean(result)
  const metaChips = formatBirthMeta({
    birthDate,
    birthTime,
    gender,
    calendarType,
  })
  const filledCount = [name, birthDate, birthTime, gender].filter(Boolean).length

  const requireSupabase = () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(SUPABASE_MISSING_MSG)
    }
    return supabase
  }

  const showToast = (message) => {
    setToast(message)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(''), 2600)
  }

  const applyReadingToForm = (data) => {
    setName(data.name ?? '')
    setBirthDate(data.birth_date ?? '')
    setBirthTime((data.birth_time || '').slice(0, 5))
    setGender(data.gender ?? '')
    setCalendarType(data.calendar_type ?? 'solar')
    setResult(data.result ?? '')
  }

  const loadReadings = async () => {
    try {
      const client = requireSupabase()
      setHistoryLoading(true)
      const { data, error: fetchError } = await client
        .from('saju_readings')
        .select('id, name, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setReadings(data ?? [])
    } catch (err) {
      console.error(err)
      if (String(err.message || '').includes('Supabase 환경변수')) {
        setError(err.message)
      }
    } finally {
      setHistoryLoading(false)
    }
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

  const createReading = async (payload) => {
    const client = requireSupabase()
    const { data, error: saveError } = await client
      .from('saju_readings')
      .insert(payload)
      .select('id, name, created_at, updated_at')
      .single()

    if (saveError) throw saveError

    setReadings((prev) => [data, ...prev])
    setActiveReadingId(data.id)
    setEditMode(false)
    return data
  }

  const updateReading = async (readingId, payload) => {
    const client = requireSupabase()
    const { data, error: updateError } = await client
      .from('saju_readings')
      .update(payload)
      .eq('id', readingId)
      .select('id, name, created_at, updated_at')
      .single()

    if (updateError) throw updateError

    setReadings((prev) =>
      prev.map((item) => (item.id === readingId ? { ...item, ...data } : item)),
    )
    setActiveReadingId(data.id)
    setEditMode(false)
    return data
  }

  const deleteReading = async (readingId) => {
    const client = requireSupabase()
    const { error: deleteError } = await client
      .from('saju_readings')
      .delete()
      .eq('id', readingId)

    if (deleteError) throw deleteError

    setReadings((prev) => prev.filter((item) => item.id !== readingId))
    if (activeReadingId === readingId) {
      handleNewReading({ skipBusyCheck: true })
    }
  }

  const handleNewReading = ({ skipBusyCheck = false } = {}) => {
    if (!skipBusyCheck && busy) return

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
    setEditMode(false)
    setCopyState('idle')
    snapshotRef.current = null
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
    setEditMode(false)
    setLoading(false)
    setSaving(false)
    setReadingLoading(true)
    setResult('')
    setCopyState('idle')
    scrolledRef.current = false

    try {
      const client = requireSupabase()
      const { data, error: fetchError } = await client
        .from('saju_readings')
        .select('id, name, birth_date, birth_time, gender, calendar_type, result')
        .eq('id', readingId)
        .single()

      if (fetchError) throw fetchError

      applyReadingToForm(data)
      snapshotRef.current = {
        name: data.name ?? '',
        birthDate: data.birth_date ?? '',
        birthTime: (data.birth_time || '').slice(0, 5),
        gender: data.gender ?? '',
        calendarType: data.calendar_type ?? 'solar',
        result: data.result ?? '',
      }
      setResultRevealKey((key) => key + 1)

      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        scrolledRef.current = true
      })
    } catch (err) {
      console.error(err)
      setError(err.message || '저장된 사주를 불러오지 못했습니다.')
    } finally {
      setReadingLoading(false)
    }
  }

  const handleStartEdit = () => {
    if (!activeReadingId || busy) return
    snapshotRef.current = {
      name,
      birthDate,
      birthTime,
      gender,
      calendarType,
      result,
    }
    setEditMode(true)
    setError('')
    setFieldErrors({})
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      document.getElementById('name')?.focus()
    })
  }

  const handleCancelEdit = () => {
    const snapshot = snapshotRef.current
    if (snapshot) {
      setName(snapshot.name)
      setBirthDate(snapshot.birthDate)
      setBirthTime(snapshot.birthTime)
      setGender(snapshot.gender)
      setCalendarType(snapshot.calendarType)
      setResult(snapshot.result)
    }
    setEditMode(false)
    setFieldErrors({})
    setError('')
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

  const buildPayload = (resultText) => ({
    name: name.trim(),
    birth_date: birthDate,
    birth_time: birthTime,
    gender,
    calendar_type: calendarType,
    result: resultText,
  })

  const handleSaveChanges = async () => {
    if (!activeReadingId || busy) return
    setError('')

    if (!validateForm()) {
      setError('이름, 생년월일, 태어난 시간, 성별을 모두 입력해 주세요.')
      return
    }

    setSaving(true)
    try {
      await updateReading(activeReadingId, buildPayload(result || ''))
      snapshotRef.current = {
        name: name.trim(),
        birthDate,
        birthTime,
        gender,
        calendarType,
        result,
      }
      showToast(`${name.trim()}님 정보가 수정되었어요`)
    } catch (err) {
      console.error(err)
      setError(err.message || '수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteReading = async (readingId, readingName) => {
    if (busy) return
    const label = readingName || '이 사주'
    const confirmed = window.confirm(`"${label}" 기록을 삭제할까요?`)
    if (!confirmed) return

    setSaving(true)
    setError('')
    try {
      await deleteReading(readingId)
      showToast(`${label} 기록을 삭제했어요`)
    } catch (err) {
      console.error(err)
      setError(err.message || '삭제 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const runInterpretation = async ({ readingId = null } = {}) => {
    setError('')
    setCopyState('idle')
    scrolledRef.current = false

    if (!validateForm()) {
      setError('이름, 생년월일, 태어난 시간, 성별을 모두 입력해 주세요.')
      return
    }

    if (!readingId) {
      setActiveReadingId(null)
      setEditMode(false)
      setResult('')
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

      const payload = buildPayload(text)
      if (readingId) {
        await updateReading(readingId, payload)
        showToast(`${name.trim()}님 사주가 다시 해석되었어요`)
      } else {
        await createReading(payload)
        showToast(`${name.trim()}님 사주가 저장되었어요`)
      }

      snapshotRef.current = {
        name: name.trim(),
        birthDate,
        birthTime,
        gender,
        calendarType,
        result: text,
      }
      setResultRevealKey((key) => key + 1)
    } catch (err) {
      console.error(err)
      setError(err.message || '요청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      setSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return

    if (editMode && activeReadingId) {
      await handleSaveChanges()
      return
    }

    if (isLocked) return
    await runInterpretation()
  }

  const handleReinterpret = async () => {
    if (!activeReadingId || busy) return
    await runInterpretation({ readingId: activeReadingId })
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
      ? editMode
        ? '수정 중…'
        : '저장 중…'
      : editMode
        ? '변경 저장'
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
              <li key={reading.id} className="sidebar-row">
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
                    {formatRelativeDate(reading.updated_at || reading.created_at)}
                  </span>
                </button>
                <button
                  type="button"
                  className="sidebar-delete"
                  aria-label={`${reading.name} 삭제`}
                  title="삭제"
                  onClick={() => handleDeleteReading(reading.id, reading.name)}
                  disabled={busy}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="sidebar-new"
          onClick={() => handleNewReading()}
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
                <h2 id="form-title">
                  {editMode ? 'Edit' : isSavedView ? 'Saved' : 'Start'}
                </h2>
                <p>
                  {editMode
                    ? '입력 정보를 수정한 뒤 변경을 저장하세요.'
                    : isSavedView
                      ? '저장된 사주를 보고 있어요. 수정·삭제·다시 해석이 가능해요.'
                      : `기본 정보 ${filledCount}/4 · 입력하면 해석이 시작돼요.`}
                </p>
              </div>
              {(activeReadingId || result || name) && (
                <button
                  type="button"
                  className="new-reading"
                  onClick={() => handleNewReading()}
                  disabled={busy}
                >
                  새 사주 만들기
                </button>
              )}
            </div>

            {isSavedView && (
              <div className="saved-banner" role="status">
                <div>
                  <p className="saved-banner-title">
                    {editMode ? `${name || '이름'}님 정보 수정` : `${name}님 사주`}
                  </p>
                  <p className="saved-banner-text">
                    {editMode
                      ? '이름·생년월일 등을 고친 뒤 변경 저장을 눌러주세요.'
                      : '조회 중이에요. 수정하거나 삭제할 수 있어요.'}
                  </p>
                </div>
                <div className="saved-banner-actions">
                  {editMode ? (
                    <button
                      type="button"
                      className="saved-banner-action is-ghost"
                      onClick={handleCancelEdit}
                      disabled={busy}
                    >
                      취소
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="saved-banner-action is-ghost"
                        onClick={handleStartEdit}
                        disabled={busy}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="saved-banner-action is-danger"
                        onClick={() => handleDeleteReading(activeReadingId, name)}
                        disabled={busy}
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {!isLocked && (
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
                  disabled={isLocked || busy}
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
                    disabled={isLocked || busy}
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
                    disabled={isLocked || busy}
                  />
                </div>
              </div>

              <fieldset
                className={`field choice ${fieldErrors.gender ? 'has-error' : ''}`}
                disabled={isLocked || busy}
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

              <fieldset className="field choice" disabled={isLocked || busy}>
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

              {isLocked ? (
                <div className="form-actions">
                  <button
                    type="button"
                    className="submit is-secondary"
                    onClick={handleStartEdit}
                    disabled={busy}
                  >
                    <span>정보 수정</span>
                  </button>
                  <button
                    type="button"
                    className="submit"
                    onClick={handleReinterpret}
                    disabled={busy}
                  >
                    <span>다시 해석하기</span>
                    <span className="submit-arrow" aria-hidden="true">
                      →
                    </span>
                  </button>
                </div>
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
                  {isSavedView && !saving && (
                    <span className="result-badge">{editMode ? '수정 중' : '저장됨'}</span>
                  )}
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
                    {editMode ? '변경 사항을 저장하는 중…' : '해석을 저장하는 중…'}
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
                  {activeReadingId && (
                    <button
                      type="button"
                      className="result-action is-danger"
                      onClick={() => handleDeleteReading(activeReadingId, name)}
                      disabled={busy}
                    >
                      삭제
                    </button>
                  )}
                  {activeReadingId && (
                    <button
                      type="button"
                      className="result-action"
                      onClick={handleReinterpret}
                      disabled={busy}
                    >
                      다시 해석
                    </button>
                  )}
                  <button
                    type="button"
                    className="result-action is-primary"
                    onClick={() => handleNewReading()}
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
