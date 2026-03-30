// src/lib/gateway/device-auth.ts
const STORAGE_KEY = 'qortana.broker.device.auth.v1'

type TokenEntry = { token: string; scopes: string[] }
type Store = { version: 1; deviceId: string; tokens: Record<string, TokenEntry> }

function readStore(): Store | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {return null}
    const s = JSON.parse(raw) as Store
    if (s?.version !== 1 || !s.deviceId) {return null}
    return s
  } catch { return null }
}

function writeStore(s: Store) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {}
}

export function loadDeviceAuthToken(params: { deviceId: string; role: string }): TokenEntry | null {
  const s = readStore()
  if (!s || s.deviceId !== params.deviceId) {return null}
  return s.tokens[params.role] ?? null
}

export function storeDeviceAuthToken(params: {
  deviceId: string
  role: string
  token: string
  scopes: string[]
}) {
  const s = readStore() ?? { version: 1 as const, deviceId: params.deviceId, tokens: {} }
  s.tokens[params.role] = { token: params.token, scopes: params.scopes }
  writeStore(s)
}

export function clearDeviceAuthToken(params: { deviceId: string; role: string }) {
  const s = readStore()
  if (!s) {return}
  delete s.tokens[params.role]
  writeStore(s)
}
