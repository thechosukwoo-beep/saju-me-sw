import { createClient } from '@supabase/supabase-js'
import { SUPABASE_MISSING_MSG } from '../utils/constants'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
).trim()

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null

export function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(SUPABASE_MISSING_MSG)
  }
  return supabase
}
