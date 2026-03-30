'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, CheckSquare, Sun, Workflow, Building2 } from 'lucide-react'

const NAV = [
  { label: 'Chat', href: '/', icon: MessageSquare },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Today', href: '/today', icon: Sun },
  { label: 'Flows', href: '/workflows', icon: Workflow },
  { label: 'Biz', href: '/business', icon: Building2 },
] as const

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 flex z-20"
      style={{
        borderTop: '1px solid var(--q-border)',
        background: 'linear-gradient(0deg, #fbf7f0 0%, #f3eadb 100%)',
      }}
    >
      {NAV.map(({ label, href, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium"
            style={{ color: active ? 'var(--q-gold)' : 'var(--q-text-muted)' }}
          >
            <Icon size={20} strokeWidth={1.75} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
