import { isSupabaseConfigured } from '../../lib/supabase'

export default function Hero({ authLoading, user, authBusy, onSignIn }) {
  return (
    <header className="hero">
      <div className="hero-copy">
        <div className="hero-top">
          <span className="badge">SAJU ME</span>
          <span className="badge-dot" aria-hidden="true" />
          {!authLoading && !user ? (
            <button
              type="button"
              className="hero-signin"
              data-ga-event="login_click"
              onClick={onSignIn}
              disabled={authBusy || !isSupabaseConfigured}
            >
              Google 로그인
            </button>
          ) : null}
        </div>
        <p className="brand">사주미</p>
        <h1 className="headline">
          오늘의 나를
          <br />
          <span className="headline-accent">더 선명하게</span>
        </h1>
        <p className="lede">
          {user ? (
            <>
              <span className="lede-line">
                생년월일만 넣으면, AI가 성격·기질·재능을
              </span>
              <br />
              바로 읽어드려요.
            </>
          ) : (
            <>
              <span className="lede-line">
                Google로 로그인한 뒤, 생년월일만 넣으면 AI가 성격·기질·재능을
              </span>
              <br />
              읽어드려요.
            </>
          )}
        </p>
      </div>
      <img
        className="hero-mascot"
        src="/images/main-sjrnfl.png"
        alt="사주미 마스코트 너구리"
        width={220}
        height={220}
        decoding="async"
      />
    </header>
  )
}
