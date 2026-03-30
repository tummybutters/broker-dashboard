import { describe, it, expect } from 'vitest'
import { handleChatEvent, type ChatState } from './chat'

function makeState(overrides: Partial<ChatState> = {}): ChatState {
  return {
    sessionKey: 'test-session',
    messages: [],
    stream: null,
    runId: null,
    streamStartedAt: null,
    sending: false,
    loading: false,
    error: null,
    ...overrides,
  }
}

describe('handleChatEvent', () => {
  it('accumulates delta stream text', () => {
    const state = makeState()
    handleChatEvent(state, {
      runId: 'r1',
      sessionKey: 'test-session',
      state: 'delta',
      message: { text: 'Hello' },
    })
    expect(state.stream).toBe('Hello')
  })

  it('commits message to history on final', () => {
    const state = makeState({ stream: 'Hello world', runId: 'r1' })
    handleChatEvent(state, {
      runId: 'r1',
      sessionKey: 'test-session',
      state: 'final',
      message: { role: 'assistant', content: [{ type: 'text', text: 'Hello world' }] },
    })
    expect(state.messages).toHaveLength(1)
    expect(state.stream).toBeNull()
    expect(state.runId).toBeNull()
  })

  it('ignores events for wrong sessionKey', () => {
    const state = makeState()
    handleChatEvent(state, {
      runId: 'r1',
      sessionKey: 'other-session',
      state: 'delta',
      message: { text: 'X' },
    })
    expect(state.stream).toBeNull()
  })

  it('sets error on error state and clears stream', () => {
    const state = makeState({ runId: 'r1', stream: 'partial' })
    handleChatEvent(state, {
      runId: 'r1',
      sessionKey: 'test-session',
      state: 'error',
      errorMessage: 'timeout',
    })
    expect(state.error).toBe('timeout')
    expect(state.stream).toBeNull()
  })
})
