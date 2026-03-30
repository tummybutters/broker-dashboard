const ACTIONS = [
  { label: 'New Deal', prompt: 'Help me start a new deal.' },
  { label: 'Follow Up', prompt: 'Which clients should I follow up with today?' },
  { label: 'Check Emails', prompt: 'Summarize any important emails or messages I need to review.' },
  { label: 'Today', prompt: "What are my priorities for today?" },
]

export function QuickActions({ onAction }: { onAction: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 px-4 md:px-8 pb-2">
      {ACTIONS.map(({ label, prompt }) => (
        <button
          key={label}
          onClick={() => onAction(prompt)}
          className="text-xs font-medium px-3 py-1.5 transition-colors"
          style={{
            border: '1px solid var(--border-mid)',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            background: 'rgba(255,255,255,0.5)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.85)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.5)')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
