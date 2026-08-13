import { digitsOnly } from '../../../utils/profileUtils'
import { CALENDAR_OPTIONS, GENDER_OPTIONS } from '../../../utils/constants'
import ChoiceChips from './ChoiceChips'

export default function PersonFields({
  idPrefix = '',
  genderName = 'gender',
  calendarName = 'calendarType',
  values,
  fieldErrors = {},
  disabled = false,
  autoFocusName = false,
  autoComplete = false,
  monthRef,
  dayRef,
  onFieldChange,
  onClearError,
}) {
  const id = (name) => `${idPrefix}${name}`

  const update = (field, value) => {
    onFieldChange(field, value)
    if (fieldErrors[field]) onClearError(field)
  }

  return (
    <>
      <div className={`field ${fieldErrors.name ? 'has-error' : ''}`}>
        <label htmlFor={id('name')}>
          <span className="field-emoji" aria-hidden="true">
            👤
          </span>
          이름
        </label>
        <input
          id={id('name')}
          type="text"
          value={values.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="이름을 입력하세요"
          autoComplete={autoComplete ? 'name' : 'off'}
          disabled={disabled}
          autoFocus={autoFocusName}
        />
      </div>

      <ChoiceChips
        legend="성별"
        emoji="⚧"
        name={genderName}
        value={values.gender}
        options={GENDER_OPTIONS}
        error={fieldErrors.gender}
        disabled={disabled}
        onChange={(next) => update('gender', next)}
      />

      <ChoiceChips
        legend="달력"
        emoji="📆"
        name={calendarName}
        value={values.calendarType}
        options={CALENDAR_OPTIONS}
        error={fieldErrors.calendarType}
        disabled={disabled}
        onChange={(next) => update('calendarType', next)}
      />

      <div className={`field ${fieldErrors.birthDate ? 'has-error' : ''}`}>
        <label htmlFor={id('birthYear')}>
          <span className="field-emoji" aria-hidden="true">
            🎂
          </span>
          생년월일 (YYYY / MM / DD)
        </label>
        <div className="date-parts">
          <input
            id={id('birthYear')}
            type="text"
            inputMode="numeric"
            autoComplete={autoComplete ? 'bday-year' : 'off'}
            placeholder="YYYY"
            value={values.birthYear}
            maxLength={4}
            onChange={(e) => {
              const next = digitsOnly(e.target.value, 4)
              if (fieldErrors.birthDate) onClearError('birthDate')
              onFieldChange('birthYear', next)
              if (next.length === 4) monthRef?.current?.focus()
            }}
            disabled={disabled}
          />
          <input
            id={id('birthMonth')}
            ref={monthRef}
            type="text"
            inputMode="numeric"
            autoComplete={autoComplete ? 'bday-month' : 'off'}
            placeholder="월"
            value={values.birthMonth}
            maxLength={2}
            onChange={(e) => {
              const next = digitsOnly(e.target.value, 2)
              if (fieldErrors.birthDate) onClearError('birthDate')
              onFieldChange('birthMonth', next)
              if (next.length === 2) dayRef?.current?.focus()
            }}
            disabled={disabled}
          />
          <input
            id={id('birthDay')}
            ref={dayRef}
            type="text"
            inputMode="numeric"
            autoComplete={autoComplete ? 'bday-day' : 'off'}
            placeholder="일"
            value={values.birthDay}
            maxLength={2}
            onChange={(e) => {
              const next = digitsOnly(e.target.value, 2)
              if (fieldErrors.birthDate) onClearError('birthDate')
              onFieldChange('birthDay', next)
            }}
            disabled={disabled}
          />
        </div>
      </div>

      <div className={`field ${fieldErrors.birthTime ? 'has-error' : ''}`}>
        <div className="field-label-row">
          <label htmlFor={id('birthTime')}>
            <span className="field-emoji" aria-hidden="true">
              ⏰
            </span>
            태어난 시간
          </label>
          <label className="time-unknown">
            <input
              type="checkbox"
              checked={values.birthTimeUnknown}
              onChange={(e) => {
                const checked = e.target.checked
                onFieldChange('birthTimeUnknown', checked)
                if (checked) {
                  onFieldChange('birthTime', '')
                  if (fieldErrors.birthTime) onClearError('birthTime')
                }
              }}
              disabled={disabled}
            />
            시간 모름
          </label>
        </div>
        <input
          id={id('birthTime')}
          type="time"
          value={values.birthTime}
          onChange={(e) => {
            onFieldChange('birthTime', e.target.value)
            if (values.birthTimeUnknown) onFieldChange('birthTimeUnknown', false)
            if (fieldErrors.birthTime) onClearError('birthTime')
          }}
          disabled={disabled || values.birthTimeUnknown}
        />
      </div>
    </>
  )
}
