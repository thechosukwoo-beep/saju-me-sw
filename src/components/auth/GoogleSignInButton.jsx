export default function GoogleSignInButton({
  onClick,
  disabled = false,
  children = 'Google로 계속하기',
}) {
  return (
    <button
      type="button"
      className="google-signin"
      data-ga-event="login_click"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="google-signin-icon" aria-hidden="true">
        G
      </span>
      {children}
    </button>
  )
}
