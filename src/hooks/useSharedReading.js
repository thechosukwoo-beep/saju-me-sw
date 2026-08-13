import { useEffect, useRef, useState } from 'react'
import { trackEvent } from '../lib/analytics'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getShareUrl, shareReading, UUID_RE } from '../lib/share'
import { useToast } from './useToast'

export function useSharedReading(readingId) {
  const [reading, setReading] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareState, setShareState] = useState('idle')
  const { toast, showToast } = useToast()
  const shareTimerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!UUID_RE.test(readingId || '')) {
        setReading(null)
        setError('not-found')
        setLoading(false)
        return
      }

      if (!isSupabaseConfigured || !supabase) {
        setError('config')
        setLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await supabase.rpc(
          'get_shared_saju_reading',
          { p_id: readingId },
        )
        if (fetchError) throw fetchError

        const row = Array.isArray(data) ? data[0] : data
        if (!row) {
          if (!cancelled) {
            setReading(null)
            setError('not-found')
          }
          return
        }

        if (!cancelled) {
          setReading(row)
          setError('')
          trackEvent('share_page_view', { item_id: readingId })
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setReading(null)
          setError(err.message || '결과를 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current)
    }
  }, [readingId])

  useEffect(() => {
    const previous = document.title
    if (reading?.name) {
      document.title = `${reading.name}님의 사주 결과 | 사주미`
    } else if (!loading && error) {
      document.title = '사주 결과를 찾을 수 없어요 | 사주미'
    } else {
      document.title = '공유된 사주 결과 | 사주미'
    }
    return () => {
      document.title = previous
    }
  }, [reading, loading, error])

  const handleShare = async () => {
    if (!reading?.id) return
    try {
      const outcome = await shareReading({
        name: reading.name,
        url: getShareUrl(reading.id),
      })
      if (outcome === 'cancelled') {
        trackEvent('share', {
          method: 'cancelled',
          content_type: 'saju_reading',
          source: 'share_page',
        })
        return
      }
      setShareState(outcome)
      trackEvent('share', {
        method: outcome,
        content_type: 'saju_reading',
        source: 'share_page',
      })
      if (outcome === 'copied') showToast('공유 링크를 복사했어요')
      if (outcome === 'shared') showToast('공유했어요')
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current)
      shareTimerRef.current = setTimeout(() => setShareState('idle'), 1800)
    } catch (err) {
      console.error(err)
      setShareState('failed')
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current)
      shareTimerRef.current = setTimeout(() => setShareState('idle'), 1800)
    }
  }

  return {
    reading,
    loading,
    error,
    shareState,
    toast,
    handleShare,
  }
}
