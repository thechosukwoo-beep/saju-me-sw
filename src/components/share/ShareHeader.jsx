import { trackEvent } from '../../lib/analytics'

export default function ShareHeader() {
  const goHome = (source) => {
    trackEvent('share_cta_click', { source })
  }

  return (
    <header className="share-top">
      <a
        className="share-brand"
        href="/"
        data-ga-event="share_cta_click"
        onClick={() => goHome('header_brand')}
      >
        <span className="badge">SAJU GURI</span>
        <span className="share-brand-name">사주미</span>
      </a>
      <a
        className="share-home"
        href="/"
        data-ga-event="share_cta_click"
        onClick={() => goHome('header')}
      >
        내 사주 보러가기
      </a>
    </header>
  )
}
