import PersonFields from '../common/form/PersonFields'
import SavedBanner from './SavedBanner'

export default function ReadingPanel({
  formPulseKey,
  formRef,
  monthRef,
  dayRef,
  editMode,
  isSavedView,
  isLocked,
  busy,
  needsProfile,
  user,
  profile,
  formValues,
  fieldErrors,
  error,
  shareState,
  submitLabel,
  onNewReading,
  onCancelEdit,
  onShare,
  onStartEdit,
  onDelete,
  onSubmit,
  onReinterpret,
  onFieldChange,
  onClearError,
}) {
  const description = editMode
    ? '입력 정보를 수정한 뒤 변경을 저장하세요.'
    : isSavedView
      ? '저장된 사주를 보고 있어요. 수정·삭제·다시 해석이 가능해요.'
      : user
        ? profile
          ? '프로필 정보로 바로 해석할 수 있어요. 필요하면 수정하세요.'
          : '기본 정보를 등록하면 해석이 시작돼요.'
        : 'Google로 로그인하면 해석과 저장이 시작돼요.'

  return (
    <section
      key={formPulseKey}
      className={formPulseKey > 0 ? 'panel is-fresh' : 'panel'}
      aria-labelledby="form-title"
      ref={formRef}
    >
      <div className="panel-head">
        <div className="panel-head-copy">
          <h2 id="form-title">
            {editMode ? 'Edit' : isSavedView ? 'Saved' : 'Start'}
          </h2>
          <p>{description}</p>
        </div>
        <button
          type="button"
          className="new-reading"
          data-ga-event="new_reading"
          onClick={onNewReading}
          disabled={busy && Boolean(user)}
        >
          새 사주 만들기
        </button>
      </div>

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

      <form className="form" onSubmit={onSubmit}>
        <PersonFields
          values={formValues}
          fieldErrors={fieldErrors}
          disabled={isLocked || busy}
          autoComplete
          monthRef={monthRef}
          dayRef={dayRef}
          onFieldChange={onFieldChange}
          onClearError={onClearError}
        />

        {needsProfile && (
          <p className="form-hint" role="status">
            프로필 등록이 필요해요. 기본 정보를 먼저 입력해 주세요.
          </p>
        )}

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
              data-ga-event="edit_reading"
              onClick={onStartEdit}
              disabled={busy}
            >
              <span>정보 수정</span>
            </button>
            <button
              type="button"
              className="submit"
              data-ga-event="reinterpret_reading"
              onClick={onReinterpret}
              disabled={busy || needsProfile}
            >
              <span>다시 해석하기</span>
              <span className="submit-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        ) : (
          <button
            type="submit"
            className="submit"
            data-ga-event={editMode ? 'save_reading' : 'generate_reading'}
            disabled={busy || (needsProfile && !editMode)}
          >
            <span>{submitLabel}</span>
            <span className="submit-arrow" aria-hidden="true">
              →
            </span>
          </button>
        )}
      </form>
    </section>
  )
}
