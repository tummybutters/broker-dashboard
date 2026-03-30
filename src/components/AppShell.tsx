import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { ConnectionBanner } from './ConnectionBanner'
import type { ConnectionStatus } from '@/lib/gateway/types'

export function AppShell({
  children,
  status,
}: {
  children: React.ReactNode
  status: ConnectionStatus
}) {
  return (
    <div
      className="flex w-full overflow-hidden"
      style={{
        height: '100dvh',
        background: 'linear-gradient(180deg, #fbf7f0 0%, #f3eadb 100%)',
      }}
    >
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <ConnectionBanner status={status} />
        <main className="flex-1 overflow-hidden pb-16 md:pb-0">{children}</main>
      </div>
      <MobileNav />
    </div>
  )
}
