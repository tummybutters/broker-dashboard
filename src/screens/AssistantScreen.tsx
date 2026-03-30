'use client'
import { useGateway } from '@/context/GatewayContext'
import { ChatThread } from '@/components/ChatThread'
import { ChatComposer } from '@/components/ChatComposer'
import { QuickActions } from '@/components/QuickActions'

export default function AssistantScreen() {
  const { messages, stream, sending, thinking, loading, status, send, abort } = useGateway()
  const connected = status === 'connected'

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-8 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="font-sans font-600 text-sm" style={{ color: 'var(--text)' }}>Assistant</h1>
        <p className="text-serif text-xs mt-0.5">your AI sales partner</p>
      </div>
      <ChatThread messages={messages} stream={stream} thinking={thinking} loading={loading} />
      <QuickActions onAction={(prompt) => void send(prompt)} />
      <ChatComposer
        onSend={(text) => void send(text)}
        onAbort={() => void abort()}
        sending={sending || thinking}
        connected={connected}
      />
    </div>
  )
}
