import { trackEvent } from '../../lib/analytics'
import ResultSkeleton from '../common/ResultSkeleton'

export function ShareLoading() {
  return (
    <section className="result is-saved" aria-labelledby="result-title" aria-busy="true">
      <div className="result-head">
        <div className="result-head-main">
          <p className="result-kicker">SHARED RESULT</p>
          <h2 id="result-title">사주 결과를 불러오는 중</h2>
          <p className="stream-status" aria-live="polite">
            공유된 해석을 열고 있어요…
          </p>
        </div>
        <img
          className="result-mascot is-bounce"
          src="/images/sub-sjrnfl.png"
          alt=""
          width={148}
          height={148}
          decoding="async"
        />
      </div>
      <div className="result-body">
        <ResultSkeleton />
      </div>
    </section>
  )
}

export function ShareEmpty({ configError, notFound, error }) {
  return (
    <section className="result share-empty" aria-labelledby="result-title">
      <div className="result-head">
        <div className="result-head-main">
          <p className="result-kicker">RESULT</p>
          <h2 id="result-title">
            {configError
              ? '결과를 열 수 없어요'
              : notFound
                ? '사주 결과를 찾을 수 없어요'
                : '결과를 불러오지 못했어요'}
          </h2>
          <p className="share-empty-text">
            {configError
              ? '서비스 설정이 아직 준비되지 않았어요.'
              : notFound
                ? '링크가 잘못되었거나, 삭제된 기록일 수 있어요.'
                : error || '잠시 후 다시 시도해 주세요.'}
          </p>
        </div>
        <img
          className="result-mascot"
          src="/images/sub-sjrnfl.png"
          alt=""
          width={148}
          height={148}
          decoding="async"
        />
      </div>
      <div className="result-actions">
        <a
          className="result-action is-primary"
          href="/"
          data-ga-event="share_cta_click"
          onClick={() => trackEvent('share_cta_click', { source: 'share_empty' })}
        >
          사주미로 돌아가기
        </a>
      </div>
    </section>
  )
}
