import type { GatewayEventFrame, GatewayResponseFrame, GatewayHelloOk, GatewayErrorInfo, ConnectionStatus } from './types'
import { loadOrCreateDeviceIdentity, signDevicePayload, buildDeviceAuthPayload } from './device-identity'
import { loadDeviceAuthToken, storeDeviceAuthToken } from './device-auth'

const NON_RECOVERABLE_CODES = new Set([
  'AUTH_TOKEN_MISSING',
  'AUTH_BOOTSTRAP_TOKEN_INVALID',
  'AUTH_PASSWORD_MISSING',
  'AUTH_PASSWORD_MISMATCH',
  'AUTH_RATE_LIMITED',
  'CONTROL_UI_DEVICE_IDENTITY_REQUIRED',
  'DEVICE_IDENTITY_REQUIRED',
])

export function isNonRecoverableError(err: GatewayErrorInfo | null): boolean {
  if (!err) {return false}
  return NON_RECOVERABLE_CODES.has(err.code)
}

export function classifyCloseError(details: { code: string } | null): ConnectionStatus {
  if (!details) {return 'reconnecting'}
  if (details.code === 'PAIRING_REQUIRED') {return 'pairing'}
  if (NON_RECOVERABLE_CODES.has(details.code)) {return 'auth-error'}
  return 'reconnecting'
}

type Pending = { resolve: (v: unknown) => void; reject: (e: unknown) => void }

export type GatewayClientOptions = {
  url: string
  token?: string
  onStatus?: (s: ConnectionStatus) => void
  onHello?: (hello: GatewayHelloOk) => void
  onEvent?: (evt: GatewayEventFrame) => void
}

export class GatewayClient {
  private ws: WebSocket | null = null
  private pending = new Map<string, Pending>()
  private closed = false
  private connectNonce: string | null = null
  private connectSent = false
  private backoffMs = 800
  private lastError: GatewayErrorInfo | undefined
  private pingInterval: ReturnType<typeof setInterval> | null = null

  constructor(private opts: GatewayClientOptions) {}

  start() {
    this.closed = false
    this.opts.onStatus?.('connecting')
    this.connect()
  }

  stop() {
    this.closed = true
    this.stopKeepalive()
    this.ws?.close()
    this.ws = null
    this.flushPending(new Error('client stopped'))
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private startKeepalive() {
    this.stopKeepalive()
    this.pingInterval = setInterval(() => {
      if (this.connected) {
        this.ws!.send(JSON.stringify({ type: 'req', id: crypto.randomUUID(), method: 'ping', params: {} }))
      }
    }, 30_000)
  }

  private stopKeepalive() {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private connect() {
    if (this.closed) {return}
    this.ws = new WebSocket(this.opts.url)
    this.ws.addEventListener('open', () => {
      this.connectNonce = null
      this.connectSent = false
      // Gateway sends connect.challenge first; fallback if it doesn't arrive
      setTimeout(() => { if (!this.connectSent) {void this.sendConnect()} }, 750)
    })
    this.ws.addEventListener('message', (ev) => this.handleMessage(String((ev).data ?? '')))
    this.ws.addEventListener('close', () => {
      this.stopKeepalive()
      const err = this.lastError
      this.lastError = undefined
      this.ws = null
      this.flushPending(new Error('gateway closed'))
      const status = classifyCloseError(err ? { code: err.code } : null)
      this.opts.onStatus?.(status)
      if (!isNonRecoverableError(err ?? null)) {
        this.scheduleReconnect()
      }
    })
    this.ws.addEventListener('error', () => {
      // close handler fires after error
    })
  }

  private scheduleReconnect() {
    if (this.closed) {return}
    const delay = this.backoffMs
    this.backoffMs = Math.min(this.backoffMs * 1.7, 15_000)
    setTimeout(() => this.connect(), delay)
  }

  private flushPending(err: Error) {
    for (const [, p] of this.pending) {p.reject(err)}
    this.pending.clear()
  }

  private async sendConnect() {
    if (this.connectSent) {return}
    this.connectSent = true

    const isSecure = typeof crypto !== 'undefined' && !!crypto.subtle
    const token = this.opts.token?.trim() || undefined
    const role = 'operator'
    const scopes = ['operator.admin', 'operator.approvals', 'operator.pairing']

    if (isSecure) {
      const identity = await loadOrCreateDeviceIdentity()
      const signedAtMs = Date.now()
      const nonce = this.connectNonce ?? ''
      const payload = buildDeviceAuthPayload({
        deviceId: identity.deviceId,
        clientId: 'broker-dashboard',
        role,
        scopes,
        signedAtMs,
        token: token ?? null,
        nonce,
      })
      const signature = await signDevicePayload(identity.privateKey, payload)
      const device = {
        id: identity.deviceId,
        publicKey: identity.publicKey,
        signature,
        signedAt: signedAtMs,
        nonce,
      }

      // Use cached device token if no explicit token provided
      const cached = loadDeviceAuthToken({ deviceId: identity.deviceId, role })
      const resolvedToken = token ?? cached?.token

      void this.request<GatewayHelloOk>('connect', {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'broker-dashboard',
          version: '1.0.0',
          platform: typeof navigator !== 'undefined' ? (navigator.platform ?? 'web') : 'web',
          mode: 'webchat',
        },
        role,
        scopes,
        caps: ['tool-events'],
        auth: resolvedToken ? { token: resolvedToken } : undefined,
        device,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'broker-dashboard',
        locale: typeof navigator !== 'undefined' ? navigator.language : 'en',
      }).then((hello) => {
        this.backoffMs = 800
        if (hello?.auth?.deviceToken) {
          storeDeviceAuthToken({
            deviceId: identity.deviceId,
            role,
            token: hello.auth.deviceToken,
            scopes: hello.auth.scopes ?? [],
          })
        }
        this.opts.onStatus?.('connected')
        this.startKeepalive()
        this.opts.onHello?.(hello)
      }).catch((err: unknown) => {
        if (err instanceof GatewayRequestError) {
          this.lastError = { code: err.code, message: err.message }
        }
        this.ws?.close(4008, 'connect failed')
      })
    } else {
      // Non-secure context (plain HTTP) — no device identity
      void this.request<GatewayHelloOk>('connect', {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'broker-dashboard',
          version: '1.0.0',
          platform: 'web',
          mode: 'webchat',
        },
        role,
        scopes,
        caps: [],
        auth: token ? { token } : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'broker-dashboard',
        locale: 'en',
      }).then((hello) => {
        this.backoffMs = 800
        this.opts.onStatus?.('connected')
        this.startKeepalive()
        this.opts.onHello?.(hello)
      }).catch((err: unknown) => {
        if (err instanceof GatewayRequestError) {
          this.lastError = { code: err.code, message: err.message }
        }
        this.ws?.close(4008, 'connect failed')
      })
    }
  }

  private handleMessage(raw: string) {
    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch { return }
    const frame = parsed as { type?: unknown }

    if (frame.type === 'event') {
      const evt = parsed as GatewayEventFrame
      if (evt.event === 'connect.challenge') {
        const payload = evt.payload as { nonce?: unknown } | undefined
        const nonce = typeof payload?.nonce === 'string' ? payload.nonce : null
        if (nonce) {
          this.connectNonce = nonce
          void this.sendConnect()
        }
        return
      }
      this.opts.onEvent?.(evt)
      return
    }

    if (frame.type === 'res') {
      const res = parsed as GatewayResponseFrame
      const p = this.pending.get(res.id)
      if (!p) {return}
      this.pending.delete(res.id)
      if (res.ok) {
        p.resolve(res.payload)
      } else {
        p.reject(new GatewayRequestError({
          code: res.error?.code ?? 'UNAVAILABLE',
          message: res.error?.message ?? 'request failed',
        }))
      }
    }
  }

  request<T = unknown>(method: string, params?: unknown): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('not connected'))
    }
    const id = crypto.randomUUID()
    this.ws.send(JSON.stringify({ type: 'req', id, method, params }))
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: (v) => resolve(v as T), reject })
    })
  }
}

export class GatewayRequestError extends Error {
  readonly code: string
  constructor(err: { code: string; message: string }) {
    super(err.message)
    this.name = 'GatewayRequestError'
    this.code = err.code
  }
}
