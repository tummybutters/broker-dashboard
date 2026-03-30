'use client'
import { useState, useRef, type KeyboardEvent } from 'react'
import { Send, Square } from 'lucide-react'

export function ChatComposer({ onSend, onAbort, sending, connected }: {
  onSend: (text: string) => void
  onAbort: () => void
  sending: boolean
  connected: boolean
}) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const text = value.trim()
    if (!text || sending || !connected) {return}
    onSend(text)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  return (
    <div className="px-4 md:px-8 pb-4 pt-2">
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
          {sending ? 'Assistant is working' : connected ? 'Press Enter to send' : 'Waiting for connection'}
        </p>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {sending ? 'Shift + Enter for a new line' : 'Shift + Enter for line breaks'}
        </p>
      </div>
      <div
        className="flex items-end gap-2 p-2"
        style={{ border: '1px solid var(--border-mid)', borderRadius: '8px', background: 'rgba(255,255,255,0.7)' }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { setValue(e.target.value); autoResize(e.target) }}
          onKeyDown={handleKeyDown}
          placeholder="Message your assistant..."
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed py-1 px-2"
          style={{ color: 'var(--text)', fontFamily: 'Jost, sans-serif', minHeight: '36px', maxHeight: '160px' }}
        />
        {sending ? (
          <button
            onClick={onAbort}
            className="h-10 px-3 flex-shrink-0 transition-opacity hover:opacity-85 font-medium text-sm"
            style={{ color: 'var(--text)', border: '1px solid var(--border-mid)', borderRadius: '6px', background: 'var(--surface)' }}
            title="Stop generation"
          >
            <span className="inline-flex items-center gap-2">
              <Square size={14} fill="currentColor" />
              Stop
            </span>
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!value.trim() || !connected}
            className="h-10 px-4 flex-shrink-0 transition-all disabled:opacity-30 font-medium text-sm"
            style={{ background: 'var(--text)', color: '#faf6ef', borderRadius: '6px', boxShadow: value.trim() && connected ? '0 8px 20px rgba(31, 23, 16, 0.16)' : 'none' }}
          >
            <span className="inline-flex items-center gap-2">
              <Send size={15} />
              Send
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
