import GoogleSignInButton from './GoogleSignInButton'

export default function LoginModal({
  open,
  busy = false,
  disabled = false,
  onSignIn,
  onClose,
}) {
  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card login-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <p className="modal-kicker">LOGIN</p>
          <h2 id="login-modal-title">로그인이 필요해요</h2>
          <p className="modal-lede">
            전체 해석을 보거나 기록을 남기려면 Google 계정으로 로그인해 주세요.
          </p>
        </div>

        <GoogleSignInButton onClick={onSignIn} disabled={busy || disabled} />

        <button
          type="button"
          className="login-modal-dismiss"
          onClick={onClose}
          disabled={busy}
        >
          나중에
        </button>
      </div>
    </div>
  )
}
