export default function TodayScreen() {
  const sections = [
    { label: 'Priorities', items: ['Send updated Broadvoice quote to Martucci', 'Review National RAM internet proposal'] },
    { label: 'Follow-ups', items: ['Southland Technology — pending decision since Tuesday', 'Fontana Foundation — check signature status'] },
    { label: 'Open loops', items: ['Ooma contract — awaiting countersign', 'Spectrum order for Fontana — confirm portal submission'] },
    { label: 'Recommended next actions', items: ['Ask assistant to draft a follow-up email to Southland', 'Run a quote check for National RAM UCaaS'] },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-8 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="font-sans font-600 text-sm" style={{ color: 'var(--text)' }}>Today</h1>
        <p className="text-serif text-xs mt-0.5">your day at a glance</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-6">
        {sections.map(({ label, items }) => (
          <div key={label}>
            <h2 className="text-xs font-600 uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{label}</h2>
            <div className="space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className="px-4 py-2.5 text-sm" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
