export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
      <div className="texture-grid absolute inset-0 opacity-50 pointer-events-none" />
      <h1 className="font-sans font-600 text-xl" style={{ color: 'var(--text)' }}>Unable to open workspace</h1>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{message}</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Contact your administrator for a new workspace link.
      </p>
    </div>
  )
}
