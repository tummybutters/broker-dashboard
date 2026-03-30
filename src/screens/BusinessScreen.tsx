'use client'

import { useGateway } from '@/context/GatewayContext'
import { buildWorkspaceSummary } from '@/lib/workspace/summary'

export default function BusinessScreen() {
  const { messages, workspaceFiles, workspaceLoading } = useGateway()
  const profile = buildWorkspaceSummary({ messages, files: workspaceFiles }).business

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-8 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="font-sans font-600 text-sm" style={{ color: 'var(--text)' }}>Business</h1>
        <p className="text-serif text-xs mt-0.5">
          {workspaceLoading ? 'loading live workspace files...' : 'your workspace context from live docs'}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-4">
        <div className="px-4 py-4" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h2 className="text-xs font-600 uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Profile</h2>
          <dl className="space-y-2">
            {([['Operator', profile.operator], ['Business', profile.business], ['Role', profile.role], ['Territory', profile.territory]] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex gap-4">
                <dt className="text-xs w-24 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{k}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--text)' }}>{v || 'Not documented yet'}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="px-4 py-4" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h2 className="text-xs font-600 uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Top Services</h2>
          <div className="flex flex-wrap gap-2">
            {(profile.topServices.length ? profile.topServices : ['Not documented yet']).map(c => (
              <span key={c} className="text-xs px-2.5 py-1 font-medium"
                style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid rgba(184,148,60,0.2)', borderRadius: '4px' }}>
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="px-4 py-4" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h2 className="text-xs font-600 uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Approved Portals</h2>
          <div className="space-y-1.5">
            {(profile.approvedPortals.length ? profile.approvedPortals : ['Not documented yet']).map(s => (
              <div key={s} className="text-sm px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)' }}>
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-4" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h2 className="text-xs font-600 uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Approved Systems</h2>
          <div className="space-y-1.5">
            {(profile.approvedSystems.length ? profile.approvedSystems : ['Not documented yet']).map(s => (
              <div key={s} className="text-sm px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)' }}>
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-4" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h2 className="text-xs font-600 uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Channel Status</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            {profile.channelStatus || 'Channel status is not documented yet.'}
          </p>
        </div>

        <div className="px-4 py-4" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h2 className="text-xs font-600 uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Auth Status</h2>
          <div className="space-y-1.5">
            {(profile.authStatuses.length ? profile.authStatuses : [{ label: 'Auth readiness', status: 'Not documented yet' }]).map((item) => (
              <div key={item.label} className="px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{item.label}</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.status}</span>
                </div>
                {item.notes && (
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
