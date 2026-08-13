import { useRef, useState } from 'react'
import { trackEvent } from '../../lib/analytics'
import PersonFields from '../common/form/PersonFields'
import {
  composeBirthDate,
  PERSON_FIELDS_ERROR_MESSAGE,
  profileToFormValues,
  validatePersonFields,
} from '../../utils/profileUtils'

export default function ProfileModal({
  open,
  mode = 'create',
  initial = null,
  busy = false,
  onSave,
  onClose = null,
}) {
  if (!open) return null

  return (
    <ProfileModalForm
      key={`${mode}-${initial?.id ?? 'new'}`}
      mode={mode}
      initial={initial}
      busy={busy}
      onSave={onSave}
      onClose={onClose}
    />
  )
}

function ProfileModalForm({ mode, initial, busy, onSave, onClose }) {
  const [values, setValues] = useState(() => profileToFormValues(initial))
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const monthRef = useRef(null)
  const dayRef = useRef(null)
  const required = mode === 'create' || !onClose

  const birthDate = composeBirthDate(
    values.birthYear,
    values.birthMonth,
    values.birthDay,
  )

  const handleFieldChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleClearError = (field) => {
    setFieldErrors((prev) => ({ ...prev, [field]: false }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy || saving) return
    setError('')

    const nextErrors = validatePersonFields({
      name: values.name,
      gender: values.gender,
      birthDate,
      birthTime: values.birthTime,
      birthTimeUnknown: values.birthTimeUnknown,
      calendarType: values.calendarType,
    })
    setFieldErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) {
      setError(PERSON_FIELDS_ERROR_MESSAGE)
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: values.name.trim(),
        birth_date: birthDate,
        birth_time: values.birthTimeUnknown ? null : values.birthTime,
        gender: values.gender,
        calendar_type: values.calendarType,
      })
      trackEvent('save_profile', { mode })
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
          <PersonFields
            idPrefix="profile-"
            genderName="profile-gender"
            calendarName="profile-calendar"
            values={values}
            fieldErrors={fieldErrors}
            disabled={busy || saving}
            autoFocusName
            autoComplete
            monthRef={monthRef}
            dayRef={dayRef}
            onFieldChange={handleFieldChange}
            onClearError={handleClearError}
          />

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
            <button
              type="submit"
              className="submit"
              data-ga-event="save_profile"
              disabled={busy || saving}
            >
              <span>
                {saving
                  ? '저장 중…'
                  : mode === 'edit'
                    ? '프로필 저장'
                    : '저장하고 시작하기'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
