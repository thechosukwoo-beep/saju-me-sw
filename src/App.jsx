import { startTransition, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'
import { buildSajuPrompt } from './sajuPrompt'
import { streamGemini } from './gemini'

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
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const resultRef = useRef(null)
  const scrolledRef = useRef(false)

  // 해석이 시작되면 결과 영역으로 한 번만 스크롤
  useEffect(() => {
    if ((loading || result) && resultRef.current && !scrolledRef.current) {
      scrolledRef.current = true
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (!loading && !result) {
      scrolledRef.current = false
    }
  }, [loading, result])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult('')
    scrolledRef.current = false

    if (!name || !birthDate || !birthTime || !gender) {
      setError('이름, 생년월일, 태어난 시간, 성별을 모두 입력해 주세요.')
      return
    }

    setLoading(true)
    try {
      const prompt = buildSajuPrompt({
        name,
        birthDate,
        birthTime,
        gender,
        calendarType,
      })

      // 글자가 올 때마다 화면에 바로 반영
      const text = await streamGemini(prompt, (partial) => {
        startTransition(() => {
          setResult(partial)
        })
      })

      if (!text) {
        setResult('결과를 받지 못했습니다.')
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Gemini 요청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const showResultPanel = loading || Boolean(result)

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <span className="badge">SAJU ME</span>
          <span className="badge-dot" aria-hidden="true" />
        </div>
        <p className="brand"></p>
        <h1 className="headline">
          오늘의 나를
          <br />
          <span className="headline-accent">더 선명하게</span>
        </h1>
        <p className="lede">생년월일만 넣으면, AI가 성격·기질·재능을 바로 읽어드려요.</p>
      </header>

      <main className="main">
        <section className="panel" aria-labelledby="form-title">
          <div className="panel-head">
            <h2 id="form-title">Start</h2>
            <p>기본 정보만 입력하면 해석이 시작돼요.</p>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">이름</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                autoComplete="name"
              />
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="birthDate">생년월일</label>
                <input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="birthTime">태어난 시간</label>
                <input
                  id="birthTime"
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                />
              </div>
            </div>

            <fieldset className="field choice">
              <legend>성별</legend>
              <div className="choice-group" role="presentation">
                <label className={gender === 'male' ? 'chip is-on' : 'chip'}>
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === 'male'}
                    onChange={(e) => setGender(e.target.value)}
                  />
                  남성
                </label>
                <label className={gender === 'female' ? 'chip is-on' : 'chip'}>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === 'female'}
                    onChange={(e) => setGender(e.target.value)}
                  />
                  여성
                </label>
              </div>
            </fieldset>

            <fieldset className="field choice">
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

            <button type="submit" className="submit" disabled={loading}>
              <span>{loading ? 'Reading…' : '내 사주 보기'}</span>
              <span className="submit-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </form>
        </section>

        {showResultPanel && (
          <section
            className={`result ${loading ? 'is-streaming' : ''}`}
            ref={resultRef}
            aria-labelledby="result-title"
            aria-busy={loading}
          >
            <div className="result-head">
              <p className="result-kicker">FOR {name || 'YOU'}</p>
              <h2 id="result-title">기본 차트 해석</h2>
              {loading && (
                <p className="stream-status" aria-live="polite">
                  {result ? '실시간으로 작성 중…' : '명식을 준비하는 중…'}
                </p>
              )}
            </div>

            <div className="result-body">
              {/* 첫 글자 나오기 전: 스켈레톤 */}
              {loading && !result && <ResultSkeleton />}

              {/* 글자가 들어오는 대로 마크다운으로 표시 */}
              {result && (
                <div className="prose">
                  <ReactMarkdown>{result}</ReactMarkdown>
                  {loading && <span className="caret" aria-hidden="true" />}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
