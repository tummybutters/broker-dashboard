const WORKFLOWS = [
  { name: 'Send a Quote', description: 'Draft and deliver a carrier quote to a client.', status: 'ready' as const },
  { name: 'Fill a Form', description: 'Complete order or contract forms via browser automation.', status: 'ready' as const },
  { name: 'Email Triage', description: 'Summarize and prioritize unread client emails.', status: 'ready' as const },
  { name: 'Portal Submission', description: 'Submit orders through carrier portals.', status: 'needs-login' as const },
  { name: 'Commission Report', description: 'Pull and format your monthly commission data.', status: 'ready' as const },
  { name: 'Spreadsheet Update', description: 'Update your quote tracking spreadsheet.', status: 'limited' as const },
]

const STATUS_CONFIG = {
  ready: { label: 'Ready', color: 'rgba(34,197,94,0.12)', text: '#15803d' },
  'needs-login': { label: 'Needs login', color: 'rgba(251,191,36,0.15)', text: '#92400e' },
  blocked: { label: 'Blocked', color: 'rgba(239,68,68,0.10)', text: '#b91c1c' },
  limited: { label: 'Limited', color: 'rgba(118,88,41,0.10)', text: 'var(--text-secondary)' },
}

export default function WorkflowsScreen() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-8 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="font-sans font-600 text-sm" style={{ color: 'var(--text)' }}>Workflows</h1>
        <p className="text-serif text-xs mt-0.5">things your assistant can run</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4">
        <div className="grid gap-3 md:grid-cols-2">
          {WORKFLOWS.map(({ name, description, status }) => {
            const cfg = STATUS_CONFIG[status]
            return (
              <div key={name} className="px-4 py-4"
                style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-sans font-600 text-sm" style={{ color: 'var(--text)' }}>{name}</h3>
                  <span className="text-xs px-2 py-0.5 font-medium flex-shrink-0"
                    style={{ background: cfg.color, color: cfg.text, borderRadius: '4px' }}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
