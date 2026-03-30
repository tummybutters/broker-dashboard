'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, CheckSquare, Sun, Workflow, Building2 } from 'lucide-react'

const NAV = [
  { label: 'Assistant', href: '/', icon: MessageSquare },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Today', href: '/today', icon: Sun },
  { label: 'Workflows', href: '/workflows', icon: Workflow },
  { label: 'Business', href: '/business', icon: Building2 },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="hidden md:flex flex-col h-full texture-stripe"
      style={{
        width: 'var(--q-sidebar-width)',
        borderRight: '1px solid var(--q-border)',
        background: 'linear-gradient(180deg, #fbf7f0 0%, #f3eadb 100%)',
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div
        className="px-6 py-5"
        style={{ borderBottom: '1px solid var(--q-border)' }}
      >
        <span
          className="font-sans font-semibold text-sm tracking-widest uppercase"
          style={{ color: 'var(--q-text)' }}
        >
          Qortana
        </span>
        <p className="text-serif text-xs mt-0.5">your workspace</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'nav-item-active' : 'hover:bg-white/40'
              }`}
              style={{
                color: active ? 'var(--q-text)' : 'var(--q-text-secondary)',
                borderRadius: '6px',
                display: 'flex',
              }}
            >
              <Icon
                size={16}
                strokeWidth={1.75}
                style={{ color: active ? 'var(--q-gold)' : 'currentColor', flexShrink: 0 }}
              />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
