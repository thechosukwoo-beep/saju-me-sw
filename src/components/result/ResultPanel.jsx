import ReactMarkdown from 'react-markdown'
import GoogleSignInButton from '../auth/GoogleSignInButton'
import LoadingNuguri from './LoadingNuguri'
import { shareButtonLabel } from '../../lib/share'
import { getResultPreview, splitResultSummary } from '../../utils/resultPreview'

export default function ResultPanel({
  resultRef,
  resultRevealKey,
  result,
  loading,
  saving,
  readingLoading,
  isSavedView,
  busy,
  user,
  isPreviewLocked = false,
  authBusy = false,
  activeReadingId,
  copyState,
  shareState,
  onShare,
  onCopy,
  onStartEdit,
  onDelete,
  onReinterpret,
  onSignIn,
}) {
  const displayResult = isPreviewLocked ? getResultPreview(result) : result
  const { summary, body } = splitResultSummary(displayResult)
  const showLock = isPreviewLocked && !loading && !readingLoading && Boolean(result)
  const isWaiting = loading || readingLoading

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
      aria-label="사주 해석"
      aria-busy={loading || readingLoading || saving}
    >
      <div className="result-loader">
        <LoadingNuguri />
        {isWaiting && (
          <p className="stream-status" aria-live="polite">
            너구리 구경하구리~
          </p>
        )}
      </div>

      <div
        className={showLock ? 'result-body is-locked' : 'result-body'}
        key={resultRevealKey}
      >
        {(summary || body) && (
          <div className={`prose ${isSavedView ? 'is-reveal' : ''}`}>
            {summary && (
              <div className="result-summary">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            )}
            {body && <ReactMarkdown>{body}</ReactMarkdown>}
            {loading && !isPreviewLocked && (
              <span className="caret" aria-hidden="true" />
            )}
          </div>
        )}
        {showLock && (
          <div className="result-lock">
            <div className="result-lock-ghost" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p className="result-lock-copy">
              밑의 자세한 해석은 Google로 로그인하면 볼 수 있구리.
            </p>
            <GoogleSignInButton
              onClick={() => onSignIn?.('result_gate')}
              disabled={authBusy || busy}
            >
              Google로 로그인하고 이어서 보기
            </GoogleSignInButton>
          </div>
        )}
      </div>

      {result && !loading && !readingLoading && (
        <div className="result-actions">
          {!isPreviewLocked && activeReadingId && (
            <button
              type="button"
              className="result-action is-primary"
              data-ga-event="share"
              onClick={onShare}
            >
              {shareButtonLabel(shareState)}
            </button>
          )}
          {!isPreviewLocked && (
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
          )}
          {!isPreviewLocked && activeReadingId && (
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
        </div>
      )}
    </section>
  )
}
