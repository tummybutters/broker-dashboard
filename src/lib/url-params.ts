export type HashParams = {
  gatewayUrl: string | null
  token: string | null
}

export function parseHashParams(hash: string): HashParams {
  const h = hash.startsWith('#') ? hash.slice(1) : hash
  if (!h) {return { gatewayUrl: null, token: null }}
  const params = new URLSearchParams(h)
  return {
    gatewayUrl: params.get('gateway'),
    token: params.get('token'),
  }
}

/** Strip gateway + token from the URL hash without triggering navigation. */
export function clearHashParams() {
  if (typeof window === 'undefined') {return}
  const h = window.location.hash.slice(1)
  if (!h) {return}
  const params = new URLSearchParams(h)
  params.delete('gateway')
  params.delete('token')
  const remaining = params.toString()
  history.replaceState(
    null,
    '',
    remaining ? `#${remaining}` : window.location.pathname + window.location.search
  )
}
