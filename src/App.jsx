import LoginModal from './components/auth/LoginModal'
import ProfileModal from './components/auth/ProfileModal'
import Toast from './components/common/Toast'
import Hero from './components/hero/Hero'
import ReadingPanel from './components/reading/ReadingPanel'
import ResultPanel from './components/result/ResultPanel'
import Sidebar from './components/sidebar/Sidebar'
import { useSajuApp } from './hooks/useSajuApp'
import { trackEvent } from './lib/analytics'
import { isSupabaseConfigured } from './lib/supabase'

function App() {
  const app = useSajuApp()

  return (
    <div className="layout">
      <div className="page">
        <img
          className="page-bg"
          src="/images/minhwa-bg.svg"
          alt=""
          aria-hidden="true"
        />
        <Sidebar
          authLoading={app.authLoading}
          user={app.user}
          userLabel={app.userLabel}
          userAvatar={app.userAvatar}
          authBusy={app.authBusy}
          profile={app.profile}
          profileMetaChips={app.profileMetaChips}
          profileLoading={app.profileLoading}
          readings={app.readings}
          historyLoading={app.historyLoading}
          activeReadingId={app.activeReadingId}
          busy={app.busy}
          onSignIn={() => app.handleGoogleSignIn('sidebar')}
          onSignOut={app.handleSignOut}
          onEditProfile={() => {
            trackEvent('edit_profile_open')
            app.setProfileModalMode('edit')
            app.setProfileModalOpen(true)
          }}
          onSelectReading={app.handleSelectReading}
          onDeleteReading={(id, name) =>
            app.handleDeleteReading(id, name, 'sidebar')
          }
          onNewReading={() => app.handleNewReading({ source: 'sidebar' })}
        />

        <div className="page-main">
          <Hero />

          <main className="main">
            <ReadingPanel
              formPulseKey={app.formPulseKey}
              formRef={app.formRef}
              editMode={app.editMode}
              isSavedView={app.isSavedView}
              isLocked={app.isLocked}
              formOpen={app.readingModalOpen}
              busy={app.busy}
              error={app.error}
              shareState={app.shareState}
              formValues={app.formValues}
              fieldErrors={app.fieldErrors}
              submitLabel={app.submitLabel}
              monthRef={app.birthMonthRef}
              dayRef={app.birthDayRef}
              onFieldChange={app.handleFieldChange}
              onClearError={app.handleClearError}
              onSubmit={app.handleSubmit}
              onNewReading={() => app.handleNewReading({ source: 'form' })}
              onCancelEdit={app.handleCancelEdit}
              onShare={() => app.handleShareResult('banner')}
              onStartEdit={() => app.handleStartEdit('form')}
              onDelete={() =>
                app.handleDeleteReading(
                  app.activeReadingId,
                  app.formValues.name,
                  'banner',
                )
              }
              onOpenForm={app.openReadingForm}
            />

            {app.showResultPanel && (
              <ResultPanel
                resultRef={app.resultRef}
                resultRevealKey={app.resultRevealKey}
                result={app.result}
                loading={app.loading}
                saving={app.saving}
                readingLoading={app.readingLoading}
                isSavedView={app.isSavedView}
                busy={app.busy}
                user={app.user}
                isPreviewLocked={app.isPreviewLocked}
                authBusy={app.authBusy}
                activeReadingId={app.activeReadingId}
                copyState={app.copyState}
                shareState={app.shareState}
                onShare={() => app.handleShareResult('result')}
                onCopy={app.handleCopyResult}
                onStartEdit={() => app.handleStartEdit('result')}
                onDelete={() =>
                  app.handleDeleteReading(
                    app.activeReadingId,
                    app.formValues.name,
                    'result',
                  )
                }
                onReinterpret={app.handleReinterpret}
                onSignIn={app.handleGoogleSignIn}
              />
            )}
          </main>
        </div>
      </div>

      <LoginModal
        open={app.loginModalOpen}
        busy={app.authBusy}
        disabled={!isSupabaseConfigured}
        onSignIn={() => app.handleGoogleSignIn('login_modal')}
        onClose={() => app.setLoginModalOpen(false)}
      />

      <ProfileModal
        open={app.profileModalOpen}
        mode={app.profileModalMode}
        initial={app.profile}
        busy={app.authBusy || app.profileLoading}
        onSave={app.saveProfile}
        onClose={
          app.profileModalMode === 'edit'
            ? () => app.setProfileModalOpen(false)
            : null
        }
      />

      <Toast message={app.toast} />
    </div>
  )
}

export default App
