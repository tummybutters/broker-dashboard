'use client'
import { useEffect, useState } from 'react'
import { parseHashParams, clearHashParams } from '@/lib/url-params'
import { GatewayProvider, useGateway } from '@/context/GatewayContext'
import { AppShell } from './AppShell'
import { ErrorScreen } from './ErrorScreen'

function Shell({ children }: { children: React.ReactNode }) {
  const { status } = useGateway()
  return <AppShell status={status}>{children}</AppShell>
}

export function WorkspaceRoot({ children }: { children: React.ReactNode }) {
  const [params, setParams] = useState<{ gatewayUrl: string | null; token: string | null } | null>(null)

  useEffect(() => {
    const parsed = parseHashParams(window.location.hash)
    if (parsed.gatewayUrl) {
      // Persist to localStorage so tab navigation doesn't lose the params
      localStorage.setItem('oc_gateway_url', parsed.gatewayUrl)
      if (parsed.token) {
        localStorage.setItem('oc_gateway_token', parsed.token)
      }
      clearHashParams()
      setParams(parsed)
    } else {
      // No hash params — fall back to localStorage
      const gatewayUrl = localStorage.getItem('oc_gateway_url')
      const token = localStorage.getItem('oc_gateway_token')
      setParams({ gatewayUrl, token })
    }
  }, [])

  if (!params) {return null} // first render — hash not yet read

  if (!params.gatewayUrl) {
    return <ErrorScreen message="No workspace URL found in your link." />
  }

  return (
    <GatewayProvider gatewayUrl={params.gatewayUrl} token={params.token ?? undefined}>
      <Shell>{children}</Shell>
    </GatewayProvider>
  )
}
