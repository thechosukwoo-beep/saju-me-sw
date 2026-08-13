import ReactMarkdown from 'react-markdown'
import { trackEvent } from '../../lib/analytics'
import { shareButtonLabel } from '../../lib/share'
import { splitResultSummary } from '../../utils/resultPreview'

export default function SharedResult({ reading, metaChips, shareState, onShare }) {
  const { summary, body } = splitResultSummary(reading.result)
  return (
    <section className="result is-saved" aria-labelledby="result-title">
      <div className="result-head">
        <div className="result-head-main">
          <div className="result-head-row">
            <p className="result-kicker">SHARED FOR {reading.name || 'YOU'}</p>
            <span className="result-badge">공유됨</span>
          </div>
          <h2 id="result-title">{reading.name}님 사주</h2>
          {metaChips.length > 0 && (
            <ul className="result-meta" aria-label="입력 정보">
              {metaChips.map((chip) => (
                <li key={chip}>{chip}</li>
              ))}
            </ul>
          )}
        </div>
        <img
          className="result-mascot"
          src="/images/sub-sjrnfl.png"
          alt="사주 결과를 전하는 너구리"
          width={148}
          height={148}
          decoding="async"
        />
        <div className="result-mascot-bubble" aria-hidden="true">
          친구가 보낸 사주 결과구리!
        </div>
      </div>

      <div className="result-body">
        <div className="prose is-reveal">
          {summary && (
            <div className="result-summary">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          )}
          <ReactMarkdown>{body || reading.result}</ReactMarkdown>
        </div>
      </div>

      <div className="result-actions">
        <button
          type="button"
          className="result-action is-primary"
          data-ga-event="share"
          onClick={onShare}
        >
          {shareButtonLabel(shareState)}
        </button>
        <a
          className="result-action"
          href="/"
          data-ga-event="share_cta_click"
          onClick={() => trackEvent('share_cta_click', { source: 'shared_result' })}
        >
          내 사주도 보기
        </a>
      </div>
    </section>
  )
}
