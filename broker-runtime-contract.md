# Broker Dashboard — Runtime Contract

This document describes the WebSocket protocol and connection model used by the broker dashboard to communicate with an OpenClaw gateway runtime.

---

## Connection URL

```
wss://<broker-tunnel>.trycloudflare.com
```

Plain WebSocket, text frames, JSON payloads. The broker's gateway URL and auth token arrive in the URL hash fragment — never sent to the server.

---

## Auth Transport

Token arrives via URL hash:
```
#gateway=wss://...&token=<static-token>
```

Passed to gateway as `connect.params.auth.token` during handshake. Hash is stripped from the browser URL immediately after reading (using `history.replaceState`).

---

## Handshake Sequence

1. Browser opens WebSocket to gateway URL
2. Gateway sends `connect.challenge` event with `{ nonce }`
3. Client sends `connect` request:

```json
{
  "type": "req", "id": "<uuid>", "method": "connect",
  "params": {
    "minProtocol": 3, "maxProtocol": 3,
    "client": { "id": "broker-dashboard", "version": "1.0.0", "platform": "web", "mode": "webchat" },
    "role": "operator",
    "scopes": ["operator.admin", "operator.approvals", "operator.pairing"],
    "caps": ["tool-events"],
    "auth": { "token": "<from-hash>" },
    "device": { "id": "...", "publicKey": "...", "signature": "...", "signedAt": ..., "nonce": "..." },
    "userAgent": "...", "locale": "..."
  }
}
```

Device identity is an ECDSA P-256 keypair stored in IndexedDB. Available because cloudflared tunnel = HTTPS = secure context.

4. Gateway replies with `hello-ok`:

```json
{
  "type": "res", "id": "...", "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "policy": { "tickIntervalMs": 15000 }
  }
}
```

May include `auth.deviceToken` for future reconnects (cached in localStorage).

If the `connect.challenge` event does not arrive within 750ms of WebSocket open, the client sends `connect` anyway (fallback timer).

---

## Chat Send

```json
{
  "method": "chat.send",
  "params": {
    "sessionKey": "<session>",
    "message": "<text>",
    "deliver": false,
    "idempotencyKey": "<uuid>"
  }
}
```

Non-blocking: acks with `{ runId, status: "started" }`. Response streams via events.

---

## Streaming Events

```json
{
  "type": "event",
  "event": "chat",
  "payload": {
    "runId": "...",
    "sessionKey": "...",
    "state": "delta" | "final" | "aborted" | "error",
    "message": {...},
    "errorMessage": "..."
  }
}
```

- `delta`: accumulate `payload.message.text` into stream buffer
- `final`: commit message to history, clear stream
- `aborted`: commit partial if buffered, clear stream
- `error`: clear stream, show `payload.errorMessage`

---

## Chat History

```json
{ "method": "chat.history", "params": { "sessionKey": "...", "limit": 200 } }
```

Returns `{ messages: [...], thinkingLevel: string | null }`. History lives in the gateway runtime — no client-side persistence needed.

---

## Abort

```json
{ "method": "chat.abort", "params": { "sessionKey": "...", "runId": "..." } }
```

---

## Session Key

Default session key: `webchat` (configurable via `NEXT_PUBLIC_DEFAULT_SESSION_KEY` env var).

The same `sessionKey` must be used for `chat.send`, `chat.history`, and event filtering.

---

## Error Codes (Non-Recoverable — Stop Auto-Reconnect)

- `AUTH_TOKEN_MISSING`
- `AUTH_BOOTSTRAP_TOKEN_INVALID`
- `AUTH_PASSWORD_MISSING`
- `AUTH_PASSWORD_MISMATCH`
- `AUTH_RATE_LIMITED`
- `CONTROL_UI_DEVICE_IDENTITY_REQUIRED`
- `DEVICE_IDENTITY_REQUIRED`

---

## Reconnect Behavior

Exponential backoff starting at 800ms, multiplier 1.7x, cap 15s. Stops only on non-recoverable auth errors.

---

## Pairing

New devices connecting remotely require one-time approval from the operator (`openclaw devices approve <id>`). The automation agent handles this automatically. The app shows "Your workspace is being activated. Hang tight." and retries — `PAIRING_REQUIRED` is **not** in the non-recoverable set.

---

## Protocol Risks

- `PAIRING_REQUIRED` on first connect is expected — automation resolves it, app retries gracefully
- `chat.history` is size-bounded (limit: 200); very long transcripts may be truncated
- Device identity requires secure context (HTTPS) — cloudflared tunnel satisfies this
- `sessionKey` must match between `chat.send`, `chat.history`, and event filtering

---

## Connection States (UI)

| State | Banner | Description |
|---|---|---|
| `connecting` | "Connecting to your workspace..." | Initial connect |
| `reconnecting` | "Reconnecting..." | Transient disconnect |
| `pairing` | "Your workspace is being activated. Hang tight." | PAIRING_REQUIRED — retrying |
| `auth-error` | "Unable to connect. Check your workspace link." | Non-recoverable auth error |
| `unreachable` | "Your workspace is unreachable right now." | Persistent network failure |
| `connected` | (hidden) | Normal operation |
