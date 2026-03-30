import type { ChatMessage } from '@/lib/gateway/types'

function extractText(msg: ChatMessage): string {
  for (const block of msg.content) {
    if (block.type === 'text' && block.text) {return block.text}
  }
  return ''
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const text = extractText(message)
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-6 h-6 flex items-center justify-center mr-2 mt-1 flex-shrink-0 text-xs font-bold"
          style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid var(--border)', borderRadius: '4px' }}>
          Q
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${isUser ? 'ml-8' : ''}`}
        style={{
          background: isUser ? 'var(--text)' : 'var(--surface)',
          color: isUser ? '#faf6ef' : 'var(--text)',
          borderRadius: '8px',
          border: isUser ? 'none' : '1px solid var(--border)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {text}
      </div>
    </div>
  )
}

export function StreamBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-6 h-6 flex items-center justify-center mr-2 mt-1 flex-shrink-0 text-xs font-bold"
        style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid var(--border)', borderRadius: '4px' }}>
        Q
      </div>
      <div
        className="max-w-[80%] px-4 py-3 text-sm leading-relaxed"
        style={{ background: 'var(--surface)', color: 'var(--text)', borderRadius: '8px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      >
        {text}
        <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse" style={{ background: 'var(--gold)' }} />
      </div>
    </div>
  )
}
