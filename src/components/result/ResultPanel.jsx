import ReactMarkdown from 'react-markdown'
import ResultSkeleton from '../common/ResultSkeleton'
import { shareButtonLabel } from '../../lib/share'

export default function ResultPanel({
  resultRef,
  resultRevealKey,
  name,
  result,
  metaChips,
  loading,
  saving,
  readingLoading,
  isSavedView,
  editMode,
  busy,
  user,
  activeReadingId,
  copyState,
  shareState,
  onShare,
  onCopy,
  onStartEdit,
  onDelete,
  onReinterpret,
  onNewReading,
}) {
  return (
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
        <div className="result-head-main">
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
        <img
          className={[
            'result-mascot',
            loading || readingLoading ? 'is-bounce' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          src="/images/sub-sjrnfl.png"
          alt="사주 결과를 전하는 너구리"
          width={148}
          height={148}
          decoding="async"
        />
        <div className="result-mascot-bubble" aria-hidden="true">
          {loading || readingLoading
            ? '잠깐만, 사주 보는 중이구리…'
            : '다 봤구리! 아래를 읽어보구리~'}
        </div>
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
          {activeReadingId && (
            <button
              type="button"
              className="result-action is-primary"
              data-ga-event="share"
              onClick={onShare}
            >
              {shareButtonLabel(shareState)}
            </button>
          )}
          <button
            type="button"
            className="result-action"
            data-ga-event="copy_result"
            onClick={onCopy}
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
              className="result-action"
              data-ga-event="edit_reading"
              onClick={onStartEdit}
              disabled={busy}
            >
              수정
            </button>
          )}
          {activeReadingId && (
            <button
              type="button"
              className="result-action is-danger"
              data-ga-event="delete_reading"
              onClick={onDelete}
              disabled={busy}
            >
              삭제
            </button>
          )}
          {activeReadingId && (
            <button
              type="button"
              className="result-action"
              data-ga-event="reinterpret_reading"
              onClick={onReinterpret}
              disabled={busy}
            >
              다시 해석
            </button>
          )}
          <button
            type="button"
            className="result-action"
            data-ga-event="new_reading"
            onClick={onNewReading}
            disabled={busy && Boolean(user)}
          >
            새 사주 만들기
          </button>
        </div>
      )}
    </section>
  )
}
