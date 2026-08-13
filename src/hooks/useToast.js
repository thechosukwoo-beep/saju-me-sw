import { useEffect, useRef, useState } from 'react'

export function useToast(duration = 2600) {
  const [toast, setToast] = useState('')
  const timerRef = useRef(null)

  const showToast = (message) => {
    setToast(message)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setToast(''), duration)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { toast, showToast, toastTimerRef: timerRef }
}
