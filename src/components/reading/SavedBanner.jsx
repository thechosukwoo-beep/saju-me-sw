import { shareButtonLabel } from '../../lib/share'

export default function SavedBanner({
  editMode,
  name,
  busy,
  shareState,
  onCancelEdit,
  onShare,
  onStartEdit,
  onDelete,
}) {
  return (
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
            onClick={onCancelEdit}
            disabled={busy}
          >
            취소
          </button>
        ) : (
          <>
            <button
              type="button"
              className="saved-banner-action is-ghost"
              data-ga-event="share"
              onClick={onShare}
              disabled={busy}
            >
              {shareButtonLabel(shareState)}
            </button>
            <button
              type="button"
              className="saved-banner-action is-ghost"
              data-ga-event="edit_reading"
              onClick={onStartEdit}
              disabled={busy}
            >
              수정
            </button>
            <button
              type="button"
              className="saved-banner-action is-danger"
              data-ga-event="delete_reading"
              onClick={onDelete}
              disabled={busy}
            >
              삭제
            </button>
          </>
        )}
      </div>
    </div>
  )
}
