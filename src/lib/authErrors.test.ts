import { describe, it, expect } from 'vitest'
import { isRateLimitError, friendlyAuthErrorMessage } from '@/lib/authErrors'

describe('isRateLimitError', () => {
  it('is true for the over_email_send_rate_limit code', () => {
    expect(isRateLimitError({ message: 'Something', code: 'over_email_send_rate_limit' })).toBe(true)
  })

  it('is true for status 429', () => {
    expect(isRateLimitError({ message: 'Too busy', status: 429 })).toBe(true)
  })

  it('is true for a rate-limit message regardless of casing', () => {
    expect(isRateLimitError({ message: 'Email rate limit exceeded' })).toBe(true)
    expect(isRateLimitError({ message: 'RATE LIMIT hit, slow down' })).toBe(true)
  })

  it('is false for unrelated errors, null, and non-objects', () => {
    expect(isRateLimitError({ message: 'Invalid login credentials' })).toBe(false)
    expect(isRateLimitError(null)).toBe(false)
    expect(isRateLimitError(undefined)).toBe(false)
    expect(isRateLimitError('rate limit')).toBe(false)
  })
})

describe('friendlyAuthErrorMessage', () => {
  it('maps rate-limit by code', () => {
    expect(
      friendlyAuthErrorMessage({ message: 'whatever', code: 'over_email_send_rate_limit' })
    ).toBe('Too many attempts. Check your inbox for a confirmation email, or wait a few minutes and try logging in.')
  })

  it('maps rate-limit by status 429', () => {
    expect(friendlyAuthErrorMessage({ message: 'Slow down', status: 429 })).toBe(
      'Too many attempts. Check your inbox for a confirmation email, or wait a few minutes and try logging in.'
    )
  })

  it('maps rate-limit by message (case-insensitive)', () => {
    expect(friendlyAuthErrorMessage({ message: 'Email rate limit exceeded' })).toBe(
      'Too many attempts. Check your inbox for a confirmation email, or wait a few minutes and try logging in.'
    )
  })

  it('maps already-registered by code', () => {
    expect(
      friendlyAuthErrorMessage({ message: 'duplicate', code: 'user_already_exists' })
    ).toBe('An account with this email already exists. Log in instead.')
  })

  it('maps already-registered by message', () => {
    expect(friendlyAuthErrorMessage({ message: 'User already registered' })).toBe(
      'An account with this email already exists. Log in instead.'
    )
    expect(friendlyAuthErrorMessage({ message: 'An account already exists for this email' })).toBe(
      'An account with this email already exists. Log in instead.'
    )
  })

  it('maps not-confirmed by message', () => {
    expect(friendlyAuthErrorMessage({ message: 'Email not confirmed' })).toBe(
      'Please confirm your email first — check your inbox, then try again.'
    )
  })

  it('passes through unknown messages and falls back for null', () => {
    expect(friendlyAuthErrorMessage({ message: 'Invalid login credentials' })).toBe(
      'Invalid login credentials'
    )
    expect(friendlyAuthErrorMessage(null)).toBe('Something went wrong. Please try again.')
    expect(friendlyAuthErrorMessage(undefined)).toBe('Something went wrong. Please try again.')
  })
})
