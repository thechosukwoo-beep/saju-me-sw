import { startTransition, useEffect, useRef, useState } from 'react'
import { trackEvent } from '../lib/analytics'
import { streamGemini } from '../lib/gemini'
import { buildSajuPrompt } from '../lib/sajuPrompt'
import { getShareUrl, shareReading } from '../lib/share'
import { requireSupabase } from '../lib/supabase'
import { OAUTH_PENDING_KEY } from '../utils/constants'
import { formatBirthMeta } from '../utils/format'
import {
  composeBirthDate,
  emptyFormValues,
  PERSON_FIELDS_ERROR_MESSAGE,
  profileToFormValues,
  splitBirthDate,
  validatePersonFields,
} from '../utils/profileUtils'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

export function useSajuApp() {
  const [formValues, setFormValues] = useState(() => emptyFormValues())
  const [userStateError, setError] = useState('')
  const { toast, showToast } = useToast()
  const { user, authLoading, authBusy, handleGoogleSignIn, handleSignOut } =
    useAuth({ setError, showToast })

  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileModalMode, setProfileModalMode] = useState('create')
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [readingLoading, setReadingLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [result, setResult] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [readings, setReadings] = useState([])
  const [activeReadingId, setActiveReadingId] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [resultRevealKey, setResultRevealKey] = useState(0)
  const [formPulseKey, setFormPulseKey] = useState(0)
  const [copyState, setCopyState] = useState('idle')
  const [shareState, setShareState] = useState('idle')

  const resultRef = useRef(null)
  const formRef = useRef(null)
  const birthMonthRef = useRef(null)
  const birthDayRef = useRef(null)
  const scrolledRef = useRef(false)
  const copyTimerRef = useRef(null)
  const shareTimerRef = useRef(null)
  const snapshotRef = useRef(null)
  const prevUserIdRef = useRef(undefined)

  const birthDate = composeBirthDate(
    formValues.birthYear,
    formValues.birthMonth,
    formValues.birthDay,
  )
  const busy = loading || saving || readingLoading || authBusy
  const needsProfile = Boolean(user) && !profile
  const isSavedView = Boolean(activeReadingId) && !loading && !saving
  const isLocked = isSavedView && !editMode
  const showResultPanel = loading || readingLoading || Boolean(result)
  const metaChips = formatBirthMeta({
    birthDate,
    birthTime: formValues.birthTime,
    birthTimeUnknown: formValues.birthTimeUnknown,
    gender: formValues.gender,
    calendarType: formValues.calendarType,
  })
  const profileMetaChips = profile
    ? formatBirthMeta({
        birthDate: profile.birth_date,
        birthTime: profile.birth_time,
        birthTimeUnknown: !profile.birth_time,
        gender: profile.gender,
        calendarType: profile.calendar_type,
      })
    : []
  const userLabel =
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    '로그인됨'
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  const applyReadingToForm = (data) => {
    const timeValue = (data.birth_time || '').slice(0, 5)
    const parts = splitBirthDate(data.birth_date ?? '')
    setFormValues({
      name: data.name ?? '',
      birthYear: parts.year,
      birthMonth: parts.month,
      birthDay: parts.day,
      birthTime: timeValue,
      birthTimeUnknown: !timeValue,
      gender: data.gender ?? 'male',
      calendarType: data.calendar_type ?? 'solar',
    })
    setResult(data.result ?? '')
  }

  const applyProfileToForm = (profileRow) => {
    setFormValues(profileToFormValues(profileRow))
  }

  const resetWorkspace = (profileRow = profile, { fillFromProfile = true } = {}) => {
    setLoading(false)
    setSaving(false)
    setReadingLoading(false)
    setResult('')
    setFieldErrors({})
    setActiveReadingId(null)
    setEditMode(false)
    setCopyState('idle')
    setShareState('idle')
    snapshotRef.current = null
    setResultRevealKey((key) => key + 1)
    scrolledRef.current = false

    if (fillFromProfile && profileRow) {
      applyProfileToForm(profileRow)
    } else {
      setFormValues(emptyFormValues())
    }
  }

  const loadProfile = async (currentUser = user) => {
    if (!currentUser?.id) return

    try {
      const client = requireSupabase()
      setProfileLoading(true)
      const { data, error: fetchError } = await client
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (!data) {
        setProfile(null)
        setProfileModalMode('create')
        setProfileModalOpen(true)
      } else {
        setProfile(data)
        applyProfileToForm(data)
        setProfileModalOpen(false)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || '프로필을 불러오지 못했습니다.')
    } finally {
      setProfileLoading(false)
    }
  }

  const saveProfile = async (payload) => {
    if (!user?.id) {
      throw new Error('로그인이 필요합니다.')
    }

    const client = requireSupabase()
    const { data, error: saveError } = await client
      .from('users')
      .upsert({ id: user.id, ...payload }, { onConflict: 'id' })
      .select('*')
      .single()

    if (saveError) throw saveError

    setProfile(data)
    applyProfileToForm(data)
    setProfileModalOpen(false)
    showToast('프로필이 저장되었어요')
  }

  const loadReadings = async () => {
    try {
      const client = requireSupabase()
      setHistoryLoading(true)
      const { data, error: fetchError } = await client
        .from('saju_readings')
        .select('id, name, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setReadings(data ?? [])
    } catch (err) {
      console.error(err)
      setError(err.message || '저장된 사주 목록을 불러오지 못했습니다.')
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- sync workspace to auth session */
  useEffect(() => {
    if (authLoading) return

    const prevUserId = prevUserIdRef.current
    const nextUserId = user?.id ?? null
    prevUserIdRef.current = nextUserId

    if (!user) {
      setReadings([])
      setHistoryLoading(false)
      setProfile(null)
      setProfileLoading(false)
      setProfileModalOpen(false)
      if (prevUserId) {
        setLoginModalOpen(false)
        resetWorkspace(null)
      }
      return
    }

    setLoginModalOpen(false)

    ;(async () => {
      await loadProfile(user)
      await loadReadings()
    })()

    if (sessionStorage.getItem(OAUTH_PENDING_KEY) === '1') {
      sessionStorage.removeItem(OAUTH_PENDING_KEY)
      trackEvent('login', { method: 'google' })
      showToast('Google 로그인 완료')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keep original session-sync behavior
  }, [user, authLoading])
  /* eslint-enable react-hooks/set-state-in-effect */

  const requireLogin = (source = 'unknown') => {
    if (user) return false
    setLoginModalOpen(true)
    trackEvent('login_prompt', { source })
    return true
  }

  useEffect(() => {
    if ((loading || result) && resultRef.current && !scrolledRef.current) {
      scrolledRef.current = true
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (!loading && !result) {
      scrolledRef.current = false
    }
  }, [loading, result])

  const createReading = async (payload) => {
    const client = requireSupabase()
    const { data, error: saveError } = await client
      .from('saju_readings')
      .insert(payload)
      .select('id, name, created_at, updated_at')
      .single()

    if (saveError) throw saveError

    setReadings((prev) => [data, ...prev])
    setActiveReadingId(data.id)
    setEditMode(false)
    return data
  }

  const updateReading = async (readingId, payload) => {
    const client = requireSupabase()
    const { data, error: updateError } = await client
      .from('saju_readings')
      .update(payload)
      .eq('id', readingId)
      .select('id, name, created_at, updated_at')
      .single()

    if (updateError) throw updateError

    setReadings((prev) =>
      prev.map((item) => (item.id === readingId ? { ...item, ...data } : item)),
    )
    setActiveReadingId(data.id)
    setEditMode(false)
    return data
  }

  const handleNewReading = ({
    skipBusyCheck = false,
    silent = false,
    source = 'unknown',
  } = {}) => {
    if (requireLogin(source)) return
    if (!skipBusyCheck && busy) return

    setError('')
    setFormPulseKey((key) => key + 1)
    resetWorkspace(null, { fillFromProfile: false })

    if (!silent) {
      trackEvent('new_reading', { source })
      showToast('새 사주 정보를 입력해 주세요')
    }

    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      document.getElementById('name')?.focus()
    })
  }

  const deleteReading = async (readingId) => {
    const client = requireSupabase()
    const { error: deleteError } = await client
      .from('saju_readings')
      .delete()
      .eq('id', readingId)

    if (deleteError) throw deleteError

    setReadings((prev) => prev.filter((item) => item.id !== readingId))
    if (activeReadingId === readingId) {
      handleNewReading({ skipBusyCheck: true, silent: true })
    }
  }

  const handleSelectReading = async (readingId) => {
    if (busy && activeReadingId !== readingId) return

    setError('')
    setFieldErrors({})
    setActiveReadingId(readingId)
    setEditMode(false)
    setLoading(false)
    setSaving(false)
    setReadingLoading(true)
    setResult('')
    setCopyState('idle')
    setShareState('idle')
    scrolledRef.current = false

    try {
      const client = requireSupabase()
      const { data, error: fetchError } = await client
        .from('saju_readings')
        .select('id, name, birth_date, birth_time, gender, calendar_type, result')
        .eq('id', readingId)
        .single()

      if (fetchError) throw fetchError

      applyReadingToForm(data)
      const timeValue = (data.birth_time || '').slice(0, 5)
      snapshotRef.current = {
        name: data.name ?? '',
        birthDate: data.birth_date ?? '',
        birthTime: timeValue,
        birthTimeUnknown: !timeValue,
        gender: data.gender ?? 'male',
        calendarType: data.calendar_type ?? 'solar',
        result: data.result ?? '',
      }
      setResultRevealKey((key) => key + 1)
      trackEvent('select_reading', { item_id: readingId })

      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        scrolledRef.current = true
      })
    } catch (err) {
      console.error(err)
      setError(err.message || '저장된 사주를 불러오지 못했습니다.')
    } finally {
      setReadingLoading(false)
    }
  }

  const handleStartEdit = (source = 'unknown') => {
    if (!activeReadingId || busy) return
    trackEvent('edit_reading', { source: typeof source === 'string' ? source : 'unknown' })
    snapshotRef.current = {
      name: formValues.name,
      birthDate,
      birthTime: formValues.birthTime,
      birthTimeUnknown: formValues.birthTimeUnknown,
      gender: formValues.gender,
      calendarType: formValues.calendarType,
      result,
    }
    setEditMode(true)
    setError('')
    setFieldErrors({})
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      document.getElementById('name')?.focus()
    })
  }

  const handleCancelEdit = () => {
    const snapshot = snapshotRef.current
    if (snapshot) {
      const parts = splitBirthDate(snapshot.birthDate)
      setFormValues({
        name: snapshot.name,
        birthYear: parts.year,
        birthMonth: parts.month,
        birthDay: parts.day,
        birthTime: snapshot.birthTime,
        birthTimeUnknown: Boolean(snapshot.birthTimeUnknown),
        gender: snapshot.gender,
        calendarType: snapshot.calendarType,
      })
      setResult(snapshot.result)
    }
    setEditMode(false)
    setFieldErrors({})
    setError('')
  }

  const validateForm = () => {
    const nextErrors = validatePersonFields({
      name: formValues.name,
      gender: formValues.gender,
      birthDate,
      birthTime: formValues.birthTime,
      birthTimeUnknown: formValues.birthTimeUnknown,
      calendarType: formValues.calendarType,
    })
    setFieldErrors(nextErrors)
    return !Object.values(nextErrors).some(Boolean)
  }

  const buildPayload = (resultText) => ({
    name: formValues.name.trim(),
    birth_date: birthDate,
    birth_time: formValues.birthTimeUnknown ? null : formValues.birthTime,
    gender: formValues.gender,
    calendar_type: formValues.calendarType,
    result: resultText,
  })

  const handleSaveChanges = async () => {
    if (!activeReadingId || busy) return
    setError('')

    if (!user) {
      setError('Google로 로그인한 뒤 저장할 수 있어요.')
      return
    }

    if (!validateForm()) {
      setError(PERSON_FIELDS_ERROR_MESSAGE)
      return
    }

    setSaving(true)
    try {
      await updateReading(activeReadingId, buildPayload(result || ''))
      snapshotRef.current = {
        name: formValues.name.trim(),
        birthDate,
        birthTime: formValues.birthTime,
        birthTimeUnknown: formValues.birthTimeUnknown,
        gender: formValues.gender,
        calendarType: formValues.calendarType,
        result,
      }
      trackEvent('save_reading')
      showToast(`${formValues.name.trim()}님 정보가 수정되었어요`)
    } catch (err) {
      console.error(err)
      setError(err.message || '수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteReading = async (readingId, readingName, source = 'unknown') => {
    if (busy) return
    const label = readingName || '이 사주'
    const confirmed = window.confirm(`"${label}" 기록을 삭제할까요?`)
    if (!confirmed) {
      trackEvent('delete_reading_cancel', { source })
      return
    }

    setSaving(true)
    setError('')
    try {
      await deleteReading(readingId)
      trackEvent('delete_reading', { source })
      showToast(`${label} 기록을 삭제했어요`)
    } catch (err) {
      console.error(err)
      setError(err.message || '삭제 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const runInterpretation = async ({ readingId = null } = {}) => {
    setError('')
    setCopyState('idle')
    setShareState('idle')
    scrolledRef.current = false

    if (!user) {
      setError('Google로 로그인한 뒤 사주를 해석·저장할 수 있어요.')
      return
    }

    if (!profile) {
      setError('기본 정보를 먼저 등록해 주세요.')
      setProfileModalMode('create')
      setProfileModalOpen(true)
      return
    }

    if (!validateForm()) {
      setError(PERSON_FIELDS_ERROR_MESSAGE)
      return
    }

    if (!readingId) {
      setActiveReadingId(null)
      setEditMode(false)
      setResult('')
    }

    setLoading(true)
    try {
      const prompt = buildSajuPrompt({
        name: formValues.name.trim(),
        birthDate,
        birthTime: formValues.birthTimeUnknown ? '' : formValues.birthTime,
        gender: formValues.gender,
        calendarType: formValues.calendarType,
      })

      const text = await streamGemini(prompt, (partial) => {
        startTransition(() => {
          setResult(partial)
        })
      })

      if (!text) {
        setResult('결과를 받지 못했습니다.')
        return
      }

      setLoading(false)
      setSaving(true)

      const payload = buildPayload(text)
      if (readingId) {
        await updateReading(readingId, payload)
        trackEvent('reinterpret_reading')
        showToast(`${formValues.name.trim()}님 사주가 다시 해석되었어요`)
      } else {
        await createReading(payload)
        trackEvent('generate_reading')
        showToast(`${formValues.name.trim()}님 사주가 저장되었어요`)
      }

      snapshotRef.current = {
        name: formValues.name.trim(),
        birthDate,
        birthTime: formValues.birthTime,
        birthTimeUnknown: formValues.birthTimeUnknown,
        gender: formValues.gender,
        calendarType: formValues.calendarType,
        result: text,
      }
      setResultRevealKey((key) => key + 1)
    } catch (err) {
      console.error(err)
      trackEvent('generate_reading_fail')
      setError(err.message || '요청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      setSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (requireLogin('submit')) return
    if (busy) return

    if (editMode && activeReadingId) {
      await handleSaveChanges()
      return
    }

    if (isLocked) return
    await runInterpretation()
  }

  const handleReinterpret = async () => {
    if (!activeReadingId || busy) return
    await runInterpretation({ readingId: activeReadingId })
  }

  const handleCopyResult = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      trackEvent('copy_result')
      setCopyState('copied')
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopyState('idle'), 1800)
    } catch (err) {
      console.error(err)
      setCopyState('failed')
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopyState('idle'), 1800)
    }
  }

  const handleShareResult = async (source = 'result') => {
    if (!activeReadingId || !result) return
    const shareSource = typeof source === 'string' ? source : 'result'
    try {
      const outcome = await shareReading({
        name: formValues.name,
        url: getShareUrl(activeReadingId),
      })
      if (outcome === 'cancelled') {
        trackEvent('share', {
          method: 'cancelled',
          content_type: 'saju_reading',
          source: shareSource,
        })
        return
      }
      setShareState(outcome)
      trackEvent('share', {
        method: outcome,
        content_type: 'saju_reading',
        source: shareSource,
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

  const handleFieldChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleClearError = (field) => {
    setFieldErrors((prev) => ({ ...prev, [field]: false }))
  }

  const submitLabel = loading
    ? 'Reading…'
    : saving
      ? editMode
        ? '수정 중…'
        : '저장 중…'
      : editMode
        ? '변경 저장'
        : '사주 보기'

  return {
    user,
    authLoading,
    authBusy,
    profile,
    profileLoading,
    profileModalOpen,
    profileModalMode,
    loginModalOpen,
    loading,
    saving,
    readingLoading,
    historyLoading,
    result,
    error: userStateError,
    toast,
    fieldErrors,
    readings,
    activeReadingId,
    editMode,
    resultRevealKey,
    formPulseKey,
    copyState,
    shareState,
    formValues,
    birthDate,
    busy,
    needsProfile,
    isSavedView,
    isLocked,
    showResultPanel,
    metaChips,
    profileMetaChips,
    userLabel,
    userAvatar,
    submitLabel,
    resultRef,
    formRef,
    birthMonthRef,
    birthDayRef,
    handleGoogleSignIn,
    handleSignOut,
    handleNewReading,
    handleSelectReading,
    handleStartEdit,
    handleCancelEdit,
    handleDeleteReading,
    handleSubmit,
    handleReinterpret,
    handleCopyResult,
    handleShareResult,
    handleFieldChange,
    handleClearError,
    saveProfile,
    setLoginModalOpen,
    setProfileModalOpen,
    setProfileModalMode,
  }
}
