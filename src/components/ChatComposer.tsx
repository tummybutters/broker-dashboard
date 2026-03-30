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
            className="p-2 flex-shrink-0 transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
            title="Stop"
          >
            <Square size={16} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!value.trim() || !connected}
            className="p-2 flex-shrink-0 transition-opacity disabled:opacity-30"
            style={{ background: 'var(--text)', color: '#faf6ef', borderRadius: '6px' }}
          >
            <Send size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
