export interface AuthErrorLike {
  message: string
  status?: number
  code?: string
}

/**
 * True when the error looks like a Supabase email rate-limit error:
 * code `over_email_send_rate_limit`, HTTP status 429, or a message
 * containing `rate limit` (case-insensitive).
 */
export function isRateLimitError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: unknown; status?: unknown; message?: unknown }
  if (e.code === 'over_email_send_rate_limit') return true
  if (e.status === 429) return true
  if (typeof e.message === 'string' && e.message.toLowerCase().includes('rate limit')) return true
  return false
}

const RATE_LIMIT_MESSAGE =
  'Too many attempts. Check your inbox for a confirmation email, or wait a few minutes and try logging in.'
const ALREADY_REGISTERED_MESSAGE = 'An account with this email already exists. Log in instead.'
const NOT_CONFIRMED_MESSAGE = 'Please confirm your email first — check your inbox, then try again.'
const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

/**
 * Map a raw auth error to a user-friendly message. Matches by code OR
 * case-insensitive message substring. Falls back to the raw message,
 * or a generic message when there is none.
 */
export function friendlyAuthErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return FALLBACK_MESSAGE
  const e = err as { message?: unknown; status?: unknown; code?: unknown }
  const code = typeof e.code === 'string' ? e.code : ''
  const rawMessage = typeof e.message === 'string' ? e.message : ''
  const msg = rawMessage.toLowerCase()
  if (isRateLimitError(err)) {
    return RATE_LIMIT_MESSAGE
  }
  // UX-first: prefer helpful login nudge on ambiguous matches.
  if (code === 'user_already_exists' || msg.includes('already registered') || msg.includes('already exists')) {
    return ALREADY_REGISTERED_MESSAGE
  }
  if (msg.includes('not confirmed')) {
    return NOT_CONFIRMED_MESSAGE
  }
  if (rawMessage) return rawMessage
  return FALLBACK_MESSAGE
}
