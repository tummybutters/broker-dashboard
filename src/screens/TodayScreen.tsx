'use client'

import { useGateway } from '@/context/GatewayContext'
import { buildWorkspaceSummary } from '@/lib/workspace/summary'

export default function TodayScreen() {
  const { messages, workspaceFiles, workspaceLoading } = useGateway()
  const summary = buildWorkspaceSummary({ messages, files: workspaceFiles })
  const sections = summary.today

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-8 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="font-sans font-600 text-sm" style={{ color: 'var(--text)' }}>Today</h1>
        <p className="text-serif text-xs mt-0.5">
          {workspaceLoading ? 'loading live workspace context...' : 'your day at a glance from live workspace activity'}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-6">
        {(summary.todayHeadline || summary.todaySummary) && (
          <div className="px-4 py-4"
            style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            {summary.todayHeadline && (
              <h2 className="font-sans font-600 text-sm mb-2" style={{ color: 'var(--text)' }}>
                {summary.todayHeadline}
              </h2>
            )}
            {summary.todaySummary && (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {summary.todaySummary}
              </p>
            )}
          </div>
        )}
        {sections.length === 0 && (
          <div className="px-4 py-3 text-sm"
            style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)' }}>
            No day summary has been written into the tenant state yet.
          </div>
        )}
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
