import { describe, it, expect } from 'vitest'
import { parseHashParams } from './url-params'

describe('parseHashParams', () => {
  it('parses gateway and token from hash', () => {
    const result = parseHashParams('#gateway=wss%3A%2F%2Fabc.trycloudflare.com&token=mytoken')
    expect(result.gatewayUrl).toBe('wss://abc.trycloudflare.com')
    expect(result.token).toBe('mytoken')
  })

  it('returns null values when hash is empty', () => {
    const result = parseHashParams('')
    expect(result.gatewayUrl).toBeNull()
    expect(result.token).toBeNull()
  })

  it('handles missing token gracefully', () => {
    const result = parseHashParams('#gateway=wss%3A%2F%2Fabc.trycloudflare.com')
    expect(result.gatewayUrl).toBe('wss://abc.trycloudflare.com')
    expect(result.token).toBeNull()
  })
})
