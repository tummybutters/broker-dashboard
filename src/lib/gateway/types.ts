export type GatewayEventFrame = {
  type: 'event'
  event: string
  payload?: unknown
  seq?: number
}

export type GatewayResponseFrame = {
  type: 'res'
  id: string
  ok: boolean
  payload?: unknown
  error?: { code: string; message: string; details?: unknown }
}

export type GatewayHelloOk = {
  type: 'hello-ok'
  protocol: number
  server?: { version?: string; connId?: string }
  features?: { methods?: string[]; events?: string[] }
  auth?: { deviceToken?: string; role?: string; scopes?: string[] }
  policy?: { tickIntervalMs?: number }
}

export type ChatEventPayload = {
  runId: string
  sessionKey: string
  state: 'delta' | 'final' | 'aborted' | 'error'
  message?: unknown
  errorMessage?: string
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: Array<{ type: string; text?: string; source?: unknown }>
  timestamp: number
}

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'pairing'
  | 'auth-error'
  | 'unreachable'

export type GatewayErrorInfo = {
  code: string
  message: string
  details?: unknown
}
