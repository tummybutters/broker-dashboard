// src/lib/gateway/device-identity.ts
const DB_NAME = 'qortana-broker'
const STORE_NAME = 'device-keys'
const KEY_ID = 'v2-ed25519'

type StoredKey = {
  deviceId: string
  publicKey: string
  privateKey: CryptoKey
}

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
    req.addEventListener('success', () => resolve(req.result))
    req.addEventListener('error', () => reject(req.error))
  })
}

async function getStored(db: IDBDatabase): Promise<StoredKey | null> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(KEY_ID)
    req.addEventListener('success', () => resolve(req.result ?? null))
    req.addEventListener('error', () => resolve(null))
  })
}

async function putStored(db: IDBDatabase, value: StoredKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(value, KEY_ID)
    tx.addEventListener('complete', () => resolve())
    tx.addEventListener('error', () => reject(tx.error))
  })
}

function bytesToBase64Url(buf: ArrayBuffer): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
  return base64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '')
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function loadOrCreateDeviceIdentity(): Promise<StoredKey> {
  const db = await openDb()
  const stored = await getStored(db)
  if (stored) {return stored}

  const kp = await crypto.subtle.generateKey(
    'Ed25519',
    true,
    ['sign']
  )
  const pubRaw = await crypto.subtle.exportKey('raw', kp.publicKey)
  const publicKey = bytesToBase64Url(pubRaw)
  const deviceId = await sha256Hex(pubRaw)
  const identity: StoredKey = { deviceId, publicKey, privateKey: kp.privateKey }
  await putStored(db, identity)
  return identity
}

export async function signDevicePayload(privateKey: CryptoKey, payload: string): Promise<string> {
  const data = new TextEncoder().encode(payload)
  const sig = await crypto.subtle.sign('Ed25519', privateKey, data)
  return bytesToBase64Url(sig)
}

function normalizeDeviceMetadataForAuth(value: string | undefined): string {
  return (value ?? '').trim().replace(/[A-Z]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 32))
}

export function buildDeviceAuthPayload(params: {
  deviceId: string
  clientId: string
  clientMode: string
  role: string
  scopes: string[]
  signedAtMs: number
  token: string | null
  nonce: string
}): string {
  return [
    'v2',
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    params.scopes.join(','),
    String(params.signedAtMs),
    params.token ?? '',
    params.nonce,
  ].join('|')
}

export function buildDeviceAuthPayloadV3(params: {
  deviceId: string
  clientId: string
  clientMode: string
  role: string
  scopes: string[]
  signedAtMs: number
  token: string | null
  nonce: string
  platform?: string
  deviceFamily?: string
}): string {
  return [
    'v3',
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    params.scopes.join(','),
    String(params.signedAtMs),
    params.token ?? '',
    params.nonce,
    normalizeDeviceMetadataForAuth(params.platform),
    normalizeDeviceMetadataForAuth(params.deviceFamily),
  ].join('|')
}
