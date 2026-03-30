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

type WorkspaceFiles = Partial<Record<
  'AGENTS.md' | 'USER.md' | 'TOOLS.md' | 'MEMORY.md' | 'IDENTITY.md' | 'MVP-DEFINITION.md' | 'state/tasks.json' | 'state/today.json' | 'state/business.json' | 'state/workflows.json',
  string
>>

const WORKSPACE_FILE_NAMES = [
  'AGENTS.md',
  'USER.md',
  'TOOLS.md',
  'MEMORY.md',
  'IDENTITY.md',
  'MVP-DEFINITION.md',
  'state/tasks.json',
  'state/today.json',
  'state/business.json',
  'state/workflows.json',
] as const

const WORKSPACE_REFRESH_INTERVAL_MS = 15000

type GatewayContextValue = {
  status: ConnectionStatus
  sessionKey: string
  messages: ChatMessage[]
  stream: string | null
  sending: boolean
  thinking: boolean
  loading: boolean
  error: string | null
  workspaceFiles: WorkspaceFiles
  workspaceLoading: boolean
  send: (text: string) => Promise<void>
  abort: () => Promise<void>
  request: <T = unknown>(method: string, params?: unknown) => Promise<T>
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
  const [, setTick] = useState(0)
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFiles>({})
  const [workspaceLoading, setWorkspaceLoading] = useState(false)

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
    let cancelled = false
    let workspaceLoadInFlight = false

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
    setWorkspaceFiles({})
    setWorkspaceLoading(false)

    async function loadWorkspaceFiles(client: GatewayClient, options: { quiet?: boolean } = {}) {
      if (workspaceLoadInFlight) {return}
      workspaceLoadInFlight = true
      if (!options.quiet && !cancelled) {
        setWorkspaceLoading(true)
      }
      let agentId = 'main'
      try {
        try {
          const identity = await client.request<{ agentId?: string }>('agent.identity.get', {
            sessionKey,
          })
          if (typeof identity?.agentId === 'string' && identity.agentId.trim()) {
            agentId = identity.agentId.trim()
          }
        } catch {
          // fall back to the default agent id when identity lookup is unavailable
        }
        const entries = await Promise.all(
          WORKSPACE_FILE_NAMES.map(async (name) => {
            try {
              const res = await client.request<{ file?: { content?: string } }>('agents.files.get', {
                agentId,
                name,
              })
              return [name, res?.file?.content ?? ''] as const
            } catch {
              return [name, ''] as const
            }
          })
        )
        if (!cancelled) {
          setWorkspaceFiles(Object.fromEntries(entries))
        }
      } finally {
        workspaceLoadInFlight = false
        if (!options.quiet && !cancelled) {
          setWorkspaceLoading(false)
        }
      }
    }

    const client = new GatewayClient({
      url: gatewayUrl,
      token,
      onStatus: (s) => setStatus(s),
      onHello: async () => {
        await loadHistory(chatRef.current, client)
        await loadWorkspaceFiles(client)
        rerender()
      },
      onEvent: (evt: GatewayEventFrame) => {
        if (evt.event === 'chat') {
          const payload = evt.payload as ChatEventPayload
          handleChatEvent(chatRef.current, payload)
          rerender()
          if (payload.state === 'final' || payload.state === 'aborted' || payload.state === 'error') {
            void loadWorkspaceFiles(client, { quiet: true })
          }
        }
      },
    })
    clientRef.current = client
    client.start()
    const workspaceRefreshInterval = window.setInterval(() => {
      if (clientRef.current === client) {
        void loadWorkspaceFiles(client, { quiet: true })
      }
    }, WORKSPACE_REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(workspaceRefreshInterval)
      client.stop()
      clientRef.current = null
    }
  }, [gatewayUrl, token, sessionKey, rerender])

  const send = useCallback(async (text: string) => {
    const client = clientRef.current
    if (!client) {return}
    const pending = sendMessage(chatRef.current, client, text)
    rerender()
    await pending
    rerender()
  }, [rerender])

  const abort = useCallback(async () => {
    const client = clientRef.current
    if (!client) {return}
    await abortRun(chatRef.current, client)
  }, [])

  const request = useCallback(async <T,>(method: string, params?: unknown): Promise<T> => {
    const client = clientRef.current
    if (!client) {throw new Error('not connected')}
    return client.request<T>(method, params)
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
        thinking: state.runId !== null && state.stream === null,
        loading: state.loading,
        error: state.error,
        workspaceFiles,
        workspaceLoading,
        send,
        abort,
        request,
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
