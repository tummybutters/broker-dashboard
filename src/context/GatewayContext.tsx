'use client'
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { GatewayClient } from '@/lib/gateway/client'
import {
  handleChatEvent,
  loadHistory,
  sendMessage,
  abortRun,
  type ChatState,
} from '@/lib/gateway/chat'
import type { ConnectionStatus, ChatMessage, GatewayEventFrame, ChatEventPayload } from '@/lib/gateway/types'

type GatewayContextValue = {
  status: ConnectionStatus
  sessionKey: string
  messages: ChatMessage[]
  stream: string | null
  sending: boolean
  loading: boolean
  error: string | null
  send: (text: string) => Promise<void>
  abort: () => Promise<void>
}

const GatewayContext = createContext<GatewayContextValue | null>(null)

export function GatewayProvider({
  children,
  gatewayUrl,
  token,
  sessionKey = 'webchat',
}: {
  children: ReactNode
  gatewayUrl: string
  token?: string
  sessionKey?: string
}) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [_tick, setTick] = useState(0)

  const chatRef = useRef<ChatState>({
    sessionKey,
    messages: [],
    stream: null,
    runId: null,
    streamStartedAt: null,
    sending: false,
    loading: false,
    error: null,
  })
  const clientRef = useRef<GatewayClient | null>(null)

  const rerender = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    // Reset chat state when connection params change
    chatRef.current = {
      sessionKey,
      messages: [],
      stream: null,
      runId: null,
      streamStartedAt: null,
      sending: false,
      loading: false,
      error: null,
    }

    const client = new GatewayClient({
      url: gatewayUrl,
      token,
      onStatus: (s) => setStatus(s),
      onHello: async () => {
        await loadHistory(chatRef.current, client)
        rerender()
      },
      onEvent: (evt: GatewayEventFrame) => {
        if (evt.event === 'chat') {
          handleChatEvent(chatRef.current, evt.payload as ChatEventPayload)
          rerender()
        }
      },
    })
    clientRef.current = client
    client.start()

    return () => {
      client.stop()
      clientRef.current = null
    }
  }, [gatewayUrl, token, sessionKey, rerender])

  const send = useCallback(async (text: string) => {
    const client = clientRef.current
    if (!client) {return}
    await sendMessage(chatRef.current, client, text)
    rerender()
  }, [rerender])

  const abort = useCallback(async () => {
    const client = clientRef.current
    if (!client) {return}
    await abortRun(chatRef.current, client)
  }, [])

  const state = chatRef.current

  return (
    <GatewayContext.Provider
      value={{
        status,
        sessionKey,
        messages: state.messages,
        stream: state.stream,
        sending: state.sending,
        loading: state.loading,
        error: state.error,
        send,
        abort,
      }}
    >
      {children}
    </GatewayContext.Provider>
  )
}

export function useGateway(): GatewayContextValue {
  const ctx = useContext(GatewayContext)
  if (!ctx) {throw new Error('useGateway must be used inside GatewayProvider')}
  return ctx
}
