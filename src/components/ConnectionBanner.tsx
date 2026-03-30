'use client'
import type { ConnectionStatus } from '@/lib/gateway/types'

type BannerConfig = { text: string; className: string }

const MESSAGES: Partial<Record<ConnectionStatus, BannerConfig>> = {
  connecting: {
    text: 'Connecting to your workspace...',
    className: 'bg-brand-surface border-b border-brand-border text-q-text-secondary',
  },
  reconnecting: {
    text: 'Reconnecting...',
    className: 'bg-amber-50 border-b border-amber-200 text-amber-800',
  },
  pairing: {
    text: 'Your workspace is being activated. Hang tight.',
    className: 'bg-amber-50 border-b border-amber-200 text-amber-800',
  },
  'auth-error': {
    text: 'Unable to connect. Check your workspace link.',
    className: 'bg-rose-50 border-b border-rose-200 text-rose-800',
  },
  unreachable: {
    text: 'Your workspace is unreachable right now.',
    className: 'bg-rose-50 border-b border-rose-200 text-rose-800',
  },
}

export function ConnectionBanner({ status }: { status: ConnectionStatus }) {
  const msg = MESSAGES[status]
  if (!msg) {return null}
  return (
    <div className={`px-4 py-2 text-sm font-medium text-center ${msg.className}`}>
      {msg.text}
    </div>
  )
}
