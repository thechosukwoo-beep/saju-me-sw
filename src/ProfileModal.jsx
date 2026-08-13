import { useEffect, useRef, useState } from 'react'
import { composeBirthDate, digitsOnly, splitBirthDate } from './profileUtils'

export default function ProfileModal({
  open,
  mode = 'create',
  initial = null,
  busy = false,
  onSave,
  onClose = null,
}) {
  const [name, setName] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false)
  const [gender, setGender] = useState('male')
  const [calendarType, setCalendarType] = useState('solar')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const monthRef = useRef(null)
  const dayRef = useRef(null)
  const required = mode === 'create' || !onClose

  useEffect(() => {
    if (!open) return
    const parts = splitBirthDate(initial?.birth_date ?? '')
    const timeValue = (initial?.birth_time || '').slice(0, 5)
    setName(initial?.name ?? '')
    setBirthYear(parts.year)
    setBirthMonth(parts.month)
    setBirthDay(parts.day)
    setBirthTime(timeValue)
    setBirthTimeUnknown(Boolean(initial) && !timeValue)
    setGender(initial?.gender ?? 'male')
    setCalendarType(initial?.calendar_type ?? 'solar')
    setFieldErrors({})
    setError('')
  }, [open, initial])

  if (!open) return null

  const birthDate = composeBirthDate(birthYear, birthMonth, birthDay)

  const validate = () => {
    const next = {
      name: !name.trim(),
      gender: !gender,
      birthDate: !birthDate,
      birthTime: !birthTimeUnknown && !birthTime,
      calendarType: !calendarType,
    }
    setFieldErrors(next)
    return !Object.values(next).some(Boolean)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy || saving) return
    setError('')
    if (!validate()) {
      setError('이름, 성별, 생년월일, 태어난 시간(또는 시간 모름), 달력을 모두 입력해 주세요.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        birth_date: birthDate,
        birth_time: birthTimeUnknown ? null : birthTime,
        gender,
        calendar_type: calendarType,
      })
    } catch (err) {
      console.error(err)
      setError(err.message || '프로필 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <div className="modal-head">
          <p className="modal-kicker">PROFILE</p>
          <h2 id="profile-modal-title">
            {mode === 'edit' ? '프로필 수정' : '기본 정보 등록'}
          </h2>
          <p className="modal-lede">
            {mode === 'edit'
              ? '저장된 프로필을 수정하면 다음 사주 입력에 바로 반영돼요.'
              : '처음 한 번만 입력하면, 다음부터는 바로 사주를 볼 수 있어요.'}
          </p>
        </div>

        <form className="form modal-form" onSubmit={handleSubmit}>
          <div className={`field ${fieldErrors.name ? 'has-error' : ''}`}>
            <label htmlFor="profile-name">
              <span className="field-emoji" aria-hidden="true">
                👤
              </span>
              이름
            </label>
            <input
              id="profile-name"
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
              disabled={busy || saving}
              autoFocus
            />
          </div>

          <fieldset
            className={`field choice ${fieldErrors.gender ? 'has-error' : ''}`}
            disabled={busy || saving}
          >
            <legend>
              <span className="field-emoji" aria-hidden="true">
                ⚧
              </span>
              성별
            </legend>
            <div className="choice-group" role="presentation">
              <label className={gender === 'male' ? 'chip is-on' : 'chip'}>
                <input
                  type="radio"
                  name="profile-gender"
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
                  name="profile-gender"
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

          <fieldset
            className={`field choice ${fieldErrors.calendarType ? 'has-error' : ''}`}
            disabled={busy || saving}
          >
            <legend>
              <span className="field-emoji" aria-hidden="true">
                📆
              </span>
              달력
            </legend>
            <div className="choice-group" role="presentation">
              <label className={calendarType === 'solar' ? 'chip is-on' : 'chip'}>
                <input
                  type="radio"
                  name="profile-calendar"
                  value="solar"
                  checked={calendarType === 'solar'}
                  onChange={(e) => {
                    setCalendarType(e.target.value)
                    if (fieldErrors.calendarType) {
                      setFieldErrors((prev) => ({ ...prev, calendarType: false }))
                    }
                  }}
                />
                양력
              </label>
              <label className={calendarType === 'lunar' ? 'chip is-on' : 'chip'}>
                <input
                  type="radio"
                  name="profile-calendar"
                  value="lunar"
                  checked={calendarType === 'lunar'}
                  onChange={(e) => {
                    setCalendarType(e.target.value)
                    if (fieldErrors.calendarType) {
                      setFieldErrors((prev) => ({ ...prev, calendarType: false }))
                    }
                  }}
                />
                음력
              </label>
            </div>
          </fieldset>

          <div className={`field ${fieldErrors.birthDate ? 'has-error' : ''}`}>
            <label htmlFor="profile-birthYear">
              <span className="field-emoji" aria-hidden="true">
                🎂
              </span>
              생년월일 (YYYY / MM / DD)
            </label>
            <div className="date-parts">
              <input
                id="profile-birthYear"
                type="text"
                inputMode="numeric"
                placeholder="YYYY"
                value={birthYear}
                maxLength={4}
                onChange={(e) => {
                  const next = digitsOnly(e.target.value, 4)
                  setBirthYear(next)
                  if (fieldErrors.birthDate) {
                    setFieldErrors((prev) => ({ ...prev, birthDate: false }))
                  }
                  if (next.length === 4) monthRef.current?.focus()
                }}
                disabled={busy || saving}
              />
              <input
                ref={monthRef}
                type="text"
                inputMode="numeric"
                placeholder="월"
                value={birthMonth}
                maxLength={2}
                onChange={(e) => {
                  const next = digitsOnly(e.target.value, 2)
                  setBirthMonth(next)
                  if (fieldErrors.birthDate) {
                    setFieldErrors((prev) => ({ ...prev, birthDate: false }))
                  }
                  if (next.length === 2) dayRef.current?.focus()
                }}
                disabled={busy || saving}
              />
              <input
                ref={dayRef}
                type="text"
                inputMode="numeric"
                placeholder="일"
                value={birthDay}
                maxLength={2}
                onChange={(e) => {
                  const next = digitsOnly(e.target.value, 2)
                  setBirthDay(next)
                  if (fieldErrors.birthDate) {
                    setFieldErrors((prev) => ({ ...prev, birthDate: false }))
                  }
                }}
                disabled={busy || saving}
              />
            </div>
          </div>

          <div className={`field ${fieldErrors.birthTime ? 'has-error' : ''}`}>
            <div className="field-label-row">
              <label htmlFor="profile-birthTime">
                <span className="field-emoji" aria-hidden="true">
                  ⏰
                </span>
                태어난 시간
              </label>
              <label className="time-unknown">
                <input
                  type="checkbox"
                  checked={birthTimeUnknown}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setBirthTimeUnknown(checked)
                    if (checked) {
                      setBirthTime('')
                      if (fieldErrors.birthTime) {
                        setFieldErrors((prev) => ({ ...prev, birthTime: false }))
                      }
                    }
                  }}
                  disabled={busy || saving}
                />
                시간 모름
              </label>
            </div>
            <input
              id="profile-birthTime"
              type="time"
              value={birthTime}
              onChange={(e) => {
                setBirthTime(e.target.value)
                if (birthTimeUnknown) setBirthTimeUnknown(false)
                if (fieldErrors.birthTime) {
                  setFieldErrors((prev) => ({ ...prev, birthTime: false }))
                }
              }}
              disabled={busy || saving || birthTimeUnknown}
            />
          </div>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            {!required && onClose ? (
              <button
                type="button"
                className="submit is-secondary"
                onClick={onClose}
                disabled={busy || saving}
              >
                취소
              </button>
            ) : null}
            <button type="submit" className="submit" disabled={busy || saving}>
              <span>{saving ? '저장 중…' : mode === 'edit' ? '프로필 저장' : '저장하고 시작하기'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
