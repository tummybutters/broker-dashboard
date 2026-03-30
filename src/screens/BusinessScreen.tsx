export default function BusinessScreen() {
  const profile = {
    company: 'Sandler Partners',
    role: 'Independent Broker',
    territory: 'Southern California',
    preferredCarriers: ['Broadvoice', 'RingCentral', 'Spectrum', 'Ooma'],
    approvedSystems: ['Hubspot CRM', 'Adobe Sign', 'Carrier Portals', 'Google Workspace'],
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-8 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="font-sans font-600 text-sm" style={{ color: 'var(--text)' }}>Business</h1>
        <p className="text-serif text-xs mt-0.5">your workspace context</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-4">
        <div className="px-4 py-4" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h2 className="text-xs font-600 uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Profile</h2>
          <dl className="space-y-2">
            {([['Company', profile.company], ['Role', profile.role], ['Territory', profile.territory]] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex gap-4">
                <dt className="text-xs w-24 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{k}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--text)' }}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="px-4 py-4" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h2 className="text-xs font-600 uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Preferred Carriers</h2>
          <div className="flex flex-wrap gap-2">
            {profile.preferredCarriers.map(c => (
              <span key={c} className="text-xs px-2.5 py-1 font-medium"
                style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid rgba(184,148,60,0.2)', borderRadius: '4px' }}>
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="px-4 py-4" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h2 className="text-xs font-600 uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Approved Systems</h2>
          <div className="space-y-1.5">
            {profile.approvedSystems.map(s => (
              <div key={s} className="text-sm px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)' }}>
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
