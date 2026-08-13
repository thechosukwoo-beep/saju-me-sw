import PersonFields from '../common/form/PersonFields'
import SavedBanner from './SavedBanner'

export default function ReadingPanel({
  formPulseKey,
  formRef,
  editMode,
  isSavedView,
  isLocked,
  formOpen,
  busy,
  error,
  shareState,
  formValues,
  fieldErrors,
  submitLabel,
  monthRef,
  dayRef,
  onFieldChange,
  onClearError,
  onSubmit,
  onNewReading,
  onCancelEdit,
  onShare,
  onStartEdit,
  onDelete,
  onOpenForm,
}) {
  return (
    <section
      key={formPulseKey}
      className={formPulseKey > 0 ? 'panel is-fresh' : 'panel'}
      aria-labelledby="visit-title"
      ref={formRef}
    >
      {isSavedView && (
        <SavedBanner
          editMode={editMode}
          name={formValues.name}
          busy={busy}
          shareState={shareState}
          onCancelEdit={onCancelEdit}
          onShare={onShare}
          onStartEdit={onStartEdit}
          onDelete={onDelete}
        />
      )}

      {error && !formOpen && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        id="visit-title"
        className="submit visit-cta"
        data-ga-event={isSavedView && !formOpen ? 'new_reading' : 'open_reading_form'}
        onClick={isSavedView && !formOpen ? onNewReading : onOpenForm}
        disabled={busy}
      >
        <span>너구리 보러 가기</span>
        <span className="submit-arrow" aria-hidden="true">
          →
        </span>
      </button>

      {formOpen && (
        <form className="reading-form" onSubmit={onSubmit}>
          <h2 id="reading-form-title" className="reading-form-title">
            {editMode ? '정보 수정' : '사주 정보 입력'}
          </h2>

          <PersonFields
            idPrefix="reading-"
            genderName="reading-gender"
            calendarName="reading-calendar"
            values={formValues}
            fieldErrors={fieldErrors}
            disabled={busy || isLocked}
            autoFocusName
            autoComplete
            monthRef={monthRef}
            dayRef={dayRef}
            onFieldChange={onFieldChange}
            onClearError={onClearError}
          />

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="submit visit-cta"
            data-ga-event={editMode ? 'save_reading' : 'generate_reading'}
            disabled={busy || isLocked}
          >
            <span>{submitLabel}</span>
            <span className="submit-arrow" aria-hidden="true">
              →
            </span>
          </button>
        </form>
      )}
    </section>
  )
}
