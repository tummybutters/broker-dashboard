'use client'
import { useEffect, useRef } from 'react'
import { MessageBubble, StreamBubble, ThinkingBubble } from './MessageBubble'
import type { ChatMessage } from '@/lib/gateway/types'

export function ChatThread({ messages, stream, thinking, loading }: {
  messages: ChatMessage[]
  stream: string | null
  thinking: boolean
  loading: boolean
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, stream, thinking])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading conversation...</p>
      </div>
    )
  }

  if (messages.length === 0 && !stream && !thinking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-8 relative">
        <div className="texture-grid absolute inset-0 opacity-40 pointer-events-none" />
        <h2 className="font-sans font-600 text-lg" style={{ color: 'var(--text)' }}>Good to see you.</h2>
        <p className="text-serif text-base">how can I help today?</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4">
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      {thinking && <ThinkingBubble />}
      {stream !== null && <StreamBubble text={stream} />}
      <div ref={bottomRef} />
    </div>
  )
}
