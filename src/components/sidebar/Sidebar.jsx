import { useState } from 'react'
import GoogleSignInButton from '../auth/GoogleSignInButton'
import { formatRelativeDate } from '../../utils/format'
import { isSupabaseConfigured } from '../../lib/supabase'

export default function Sidebar({
  authLoading,
  user,
  userLabel,
  userAvatar,
  authBusy,
  profile,
  profileMetaChips,
  profileLoading,
  readings,
  historyLoading,
  activeReadingId,
  busy,
  onSignIn,
  onSignOut,
  onEditProfile,
  onSelectReading,
  onDeleteReading,
  onNewReading,
}) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const previewReading =
    readings.find((reading) => reading.id === activeReadingId) || readings[0]
  const extraCount = Math.max(readings.length - 1, 0)
  const foldLabel = previewReading
    ? extraCount > 0
      ? `${previewReading.name} 외 ${extraCount}너굴`
      : previewReading.name
    : ''

  return (
    <aside className="sidebar" aria-labelledby="sidebar-title">
      <div className="sidebar-head">
        <div className="sidebar-head-row">
          <p className="sidebar-kicker">HISTORY</p>
          <span className="sidebar-count">
            {user ? readings.length : 0}너굴
          </span>
        </div>
        <h2 id="sidebar-title">너구리 보러 간 횟수</h2>
      </div>

      {!user ? (
        <p className="sidebar-empty">
          로그인 후 기록이 보여요.
          <span>아래에서 Google 로그인을 시작해 주세요.</span>
        </p>
      ) : historyLoading ? (
        <div className="sidebar-loading" aria-hidden="true">
          <div className="sidebar-loading-line" />
          <div className="sidebar-loading-line short" />
          <div className="sidebar-loading-line" />
        </div>
      ) : readings.length === 0 ? (
        <p className="sidebar-empty">
          아직 저장된 이름이 없어요.
          <span>첫 사주를 만들면 여기에 쌓여요.</span>
        </p>
      ) : (
        <div className="sidebar-history">
          <button
            type="button"
            className="sidebar-fold"
            aria-expanded={historyOpen}
            aria-controls="sidebar-history-list"
            onClick={() => setHistoryOpen((open) => !open)}
          >
            <span className="sidebar-fold-copy">
              <span className="sidebar-fold-name">{foldLabel}</span>
              <span className="sidebar-fold-hint">
                {historyOpen ? '접기' : '펼쳐서 보기'}
              </span>
            </span>
            <span className="sidebar-fold-chevron" aria-hidden="true">
              ⌄
            </span>
          </button>
          <div
            className={
              historyOpen ? 'sidebar-list-wrap is-open' : 'sidebar-list-wrap'
            }
          >
            <ul className="sidebar-list" id="sidebar-history-list">
              {readings.map((reading) => (
                <li key={reading.id} className="sidebar-row">
                  <button
                    type="button"
                    className={
                      activeReadingId === reading.id
                        ? 'sidebar-item is-active'
                        : 'sidebar-item'
                    }
                    data-ga-event="select_reading"
                    onClick={() => onSelectReading(reading.id)}
                    disabled={busy && activeReadingId !== reading.id}
                  >
                    <span className="sidebar-item-name">{reading.name}</span>
                    <span className="sidebar-item-date">
                      {formatRelativeDate(reading.updated_at || reading.created_at)}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="sidebar-delete"
                    aria-label={`${reading.name} 삭제`}
                    title="삭제"
                    data-ga-event="delete_reading"
                    onClick={() => onDeleteReading(reading.id, reading.name)}
                    disabled={busy}
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <button
        type="button"
        className="sidebar-new"
        data-ga-event="new_reading"
        onClick={onNewReading}
        disabled={busy && Boolean(user)}
      >
        너구리 또 보러가기
      </button>

      <div className="sidebar-auth">
        {authLoading ? (
          <p className="sidebar-auth-status">로그인 확인 중…</p>
        ) : user ? (
          <div className="sidebar-user">
            {userAvatar ? (
              <img
                className="sidebar-avatar"
                src={userAvatar}
                alt=""
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="sidebar-avatar is-fallback" aria-hidden="true">
                {(userLabel || '?').slice(0, 1)}
              </span>
            )}
            <div className="sidebar-user-copy">
              <p className="sidebar-user-name">{userLabel}</p>
              {user.email && userLabel !== user.email ? (
                <p className="sidebar-user-email">{user.email}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="sidebar-signout"
              data-ga-event="logout"
              onClick={onSignOut}
              disabled={authBusy}
            >
              로그아웃
            </button>
            {profile ? (
              <div className="sidebar-profile">
                <p className="sidebar-profile-name">{profile.name}</p>
                {profileMetaChips.length > 0 ? (
                  <ul className="sidebar-profile-meta" aria-label="프로필 정보">
                    {profileMetaChips.map((chip) => (
                      <li key={chip}>{chip}</li>
                    ))}
                  </ul>
                ) : null}
                <button
                  type="button"
                  className="sidebar-profile-edit"
                  data-ga-event="edit_profile_open"
                  onClick={onEditProfile}
                  disabled={authBusy || profileLoading}
                >
                  프로필 수정
                </button>
              </div>
            ) : (
              <p className="sidebar-profile-note">기본 정보를 등록해 주세요</p>
            )}
          </div>
        ) : (
          <div className="sidebar-auth-guest">
            <p className="sidebar-auth-copy">
              Google로 로그인하면 내 사주 기록이 저장돼요.
            </p>
            <GoogleSignInButton
              onClick={onSignIn}
              disabled={authBusy || !isSupabaseConfigured}
            />
          </div>
        )}
      </div>
    </aside>
  )
}
