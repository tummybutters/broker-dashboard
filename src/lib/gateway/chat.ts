import type { ChatMessage, ChatEventPayload } from './types'
import type { GatewayClient } from './client'

export type ChatState = {
  sessionKey: string
  messages: ChatMessage[]
  stream: string | null
  runId: string | null
  streamStartedAt: number | null
  sending: boolean
  loading: boolean
  error: string | null
}

function extractText(message: unknown): string | null {
  if (!message || typeof message !== 'object') {return null}
  const m = message as Record<string, unknown>
  if (typeof m.text === 'string') {return m.text}
  if (Array.isArray(m.content)) {
    for (const block of m.content) {
      if (block && typeof block === 'object') {
        const b = block as Record<string, unknown>
        if (b.type === 'text' && typeof b.text === 'string') {return b.text}
      }
    }
  }
  return null
}

export function handleChatEvent(state: ChatState, payload: ChatEventPayload) {
  if (payload.sessionKey !== state.sessionKey) {return}

  if (payload.state === 'delta') {
    const text = extractText(payload.message)
    if (typeof text === 'string') {state.stream = text}
  } else if (payload.state === 'final') {
    const msg = payload.message
    if (msg && typeof msg === 'object') {
      state.messages = [...state.messages, msg as ChatMessage]
    } else if (state.stream?.trim()) {
      state.messages = [
        ...state.messages,
        {
          role: 'assistant',
          content: [{ type: 'text', text: state.stream }],
          timestamp: Date.now(),
        },
      ]
    }
    state.stream = null
    state.runId = null
    state.streamStartedAt = null
  } else if (payload.state === 'aborted') {
    if (state.stream?.trim()) {
      state.messages = [
        ...state.messages,
        {
          role: 'assistant',
          content: [{ type: 'text', text: state.stream }],
          timestamp: Date.now(),
        },
      ]
    }
    state.stream = null
    state.runId = null
    state.streamStartedAt = null
  } else if (payload.state === 'error') {
    state.stream = null
    state.runId = null
    state.streamStartedAt = null
    state.error = payload.errorMessage ?? 'chat error'
  }
}

export async function loadHistory(state: ChatState, client: GatewayClient) {
  state.loading = true
  state.error = null
  try {
    const res = await client.request<{ messages?: unknown[]; thinkingLevel?: string }>(
      'chat.history',
      { sessionKey: state.sessionKey, limit: 200 }
    )
    state.messages = (res.messages ?? []) as ChatMessage[]
  } catch (err) {
    state.error = String(err)
  } finally {
    state.loading = false
  }
}

export async function sendMessage(
  state: ChatState,
  client: GatewayClient,
  text: string
): Promise<string | null> {
  const msg = text.trim()
  if (!msg) {return null}
  const runId = crypto.randomUUID()
  state.messages = [
    ...state.messages,
    {
      role: 'user',
      content: [{ type: 'text', text: msg }],
      timestamp: Date.now(),
    },
  ]
  state.sending = true
  state.error = null
  state.runId = runId
  state.stream = null
  state.streamStartedAt = Date.now()
  try {
    await client.request('chat.send', {
      sessionKey: state.sessionKey,
      message: msg,
      deliver: false,
      idempotencyKey: runId,
    })
    return runId
  } catch (err) {
    state.runId = null
    state.stream = null
    state.streamStartedAt = null
    state.error = String(err)
    return null
  } finally {
    state.sending = false
  }
}

export async function abortRun(state: ChatState, client: GatewayClient) {
  try {
    await client.request('chat.abort', {
      sessionKey: state.sessionKey,
      runId: state.runId,
    })
  } catch {
    // best-effort abort; ignore failures
  }
}
