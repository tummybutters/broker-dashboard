import { describe, it, expect } from 'vitest'
import { classifyCloseError, isNonRecoverableError } from './client'

describe('classifyCloseError', () => {
  it('returns auth-error for AUTH_TOKEN_MISSING', () => {
    expect(classifyCloseError({ code: 'AUTH_TOKEN_MISSING' })).toBe('auth-error')
  })
  it('returns pairing for PAIRING_REQUIRED', () => {
    expect(classifyCloseError({ code: 'PAIRING_REQUIRED' })).toBe('pairing')
  })
  it('returns reconnecting for unknown errors', () => {
    expect(classifyCloseError(null)).toBe('reconnecting')
  })
})

describe('isNonRecoverableError', () => {
  it('returns true for AUTH_TOKEN_MISSING', () => {
    expect(isNonRecoverableError({ code: 'AUTH_TOKEN_MISSING', message: '' })).toBe(true)
  })
  it('returns false for PAIRING_REQUIRED (should retry)', () => {
    expect(isNonRecoverableError({ code: 'PAIRING_REQUIRED', message: '' })).toBe(false)
  })
  it('returns false for null', () => {
    expect(isNonRecoverableError(null)).toBe(false)
  })
})
