import Toast from '../components/common/Toast'
import ShareHeader from '../components/share/ShareHeader'
import SharedResult from '../components/share/SharedResult'
import { ShareEmpty, ShareLoading } from '../components/share/ShareStates'
import { useSharedReading } from '../hooks/useSharedReading'
import { formatBirthMeta } from '../utils/format'

export default function ResultPage({ readingId }) {
  const { reading, loading, error, shareState, toast, handleShare } =
    useSharedReading(readingId)

  const birthTime = (reading?.birth_time || '').slice(0, 5)
  const metaChips = reading
    ? formatBirthMeta({
        birthDate: reading.birth_date ?? '',
        birthTime,
        birthTimeUnknown: !birthTime,
        gender: reading.gender ?? '',
        calendarType: reading.calendar_type ?? '',
      })
    : []

  return (
    <div className="share-page">
      <ShareHeader />

      {loading ? (
        <ShareLoading />
      ) : reading ? (
        <SharedResult
          reading={reading}
          metaChips={metaChips}
          shareState={shareState}
          onShare={handleShare}
        />
      ) : (
        <ShareEmpty
          configError={error === 'config'}
          notFound={error === 'not-found'}
          error={error}
        />
      )}

      <Toast message={toast} />
    </div>
  )
}
