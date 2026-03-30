// src/lib/gateway/device-identity.ts
const DB_NAME = 'qortana-broker'
const STORE_NAME = 'device-keys'
const KEY_ID = 'v1'

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

function ab2b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

async function generateDeviceId(publicKey: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('spki', publicKey)
  const hash = await crypto.subtle.digest('SHA-256', raw)
  return 'dev_' + ab2b64(hash).replace(/[+/=]/g, '').slice(0, 24)
}

export async function loadOrCreateDeviceIdentity(): Promise<StoredKey> {
  const db = await openDb()
  const stored = await getStored(db)
  if (stored) {return stored}

  const kp = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )
  const pubRaw = await crypto.subtle.exportKey('spki', kp.publicKey)
  const publicKey = ab2b64(pubRaw)
  const deviceId = await generateDeviceId(kp.publicKey)
  const identity: StoredKey = { deviceId, publicKey, privateKey: kp.privateKey }
  await putStored(db, identity)
  return identity
}

export async function signDevicePayload(privateKey: CryptoKey, payload: string): Promise<string> {
  const data = new TextEncoder().encode(payload)
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, data)
  return ab2b64(sig)
}

export function buildDeviceAuthPayload(params: {
  deviceId: string
  clientId: string
  role: string
  scopes: string[]
  signedAtMs: number
  token: string | null
  nonce: string
}): string {
  return JSON.stringify({
    v: 3,
    deviceId: params.deviceId,
    clientId: params.clientId,
    role: params.role,
    scopes: params.scopes,
    signedAtMs: params.signedAtMs,
    token: params.token,
    nonce: params.nonce,
  })
}
