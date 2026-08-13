export default function Hero() {
  return (
    <header className="hero">
      <div className="hero-top">
        <span className="badge">SAJU GURI</span>
        <span className="badge-dot" aria-hidden="true" />
      </div>

      <div className="hero-spotlight">
        <div className="hero-portrait-glow">
          <div className="hero-portrait-wrap">
            <img
              className="hero-portrait"
              src="/images/sjrnfehfud.jpeg"
              alt="사주미 마스코트 너구리"
              width={220}
              height={220}
              decoding="async"
            />
          </div>
        </div>
        <p className="hero-portrait-name">너굴도령</p>
        <p className="hero-bubble">우리 집에 너구리 보러 갈구리?</p>
      </div>
    </header>
  )
}
