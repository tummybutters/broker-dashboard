import { describe, expect, it } from 'vitest'
import { buildWorkspaceSummary } from './summary'
import type { ChatMessage } from '@/lib/gateway/types'

const files = {
  'USER.md': `# USER.md - Principal Profile

- **Name:** Thomas Butcher
- **Business name:** Qortana
- **Territory:** U.S. Sandler / telecom broker workflows
- **Role type:** operator and first live Sandler-agent pilot user
- **Top services sold:** telecom broker support, quotes, portal work, commissions, follow-up operations
`,
  'TOOLS.md': `# TOOLS.md - Local Setup Notes

## Messaging
- Channel status: dashboard live, Telegram bridge should be preserved during migrations

## Google Workspace
- Auth status: pending full tenant auth bootstrap

## CRM
- CRM notes: prepare CRM-ready notes and drafts first; do not assume write access until explicitly configured

## Portals
- Approved portals: Sandler Portal
- Portal workflow notes: Sandler credentials live in runtime secrets, not here. Use browser automation for portal actions.

## Email
- Inbox layer: Google Workspace

## Document Tools
- PDF / e-sign stack: preset PDF form workflow plus tenant-specific tools later
`,
  'AGENTS.md': `## Tools

- Use \`follow-up-drafting\` as the default starting pattern for reply drafts.
- Use \`crm-note-prep\` as the default starting pattern for clean internal notes.
- Use \`playwright-cli\` for browser and portal tasks.
- Use \`gws-meta-workflows\` for Gmail, Calendar, Drive, Docs, and Sheets work.
`,
  'state/business.json': JSON.stringify({
    version: 1,
    profile: {
      operator: 'Thomas Butcher',
      business: 'Qortana',
      territory: 'U.S. Sandler / telecom broker workflows',
      role: 'operator and first live Sandler-agent pilot user',
      topServices: ['quotes', 'portal work'],
    },
    approvedPortals: ['Sandler Portal'],
    approvedSystems: ['Google Workspace'],
    channelStatus: 'dashboard live',
    authStatuses: [{ label: 'Google Workspace', status: 'Pending auth' }],
  }),
  'state/tasks.json': JSON.stringify({
    version: 1,
    tasks: [
      { id: 't1', title: 'Send updated Broadvoice quote to Martucci', status: 'in-progress', source: 'assistant' },
      { id: 't2', title: 'Check Fontana signature status', status: 'waiting', source: 'human' },
    ],
  }),
  'state/today.json': JSON.stringify({
    version: 1,
    date: '2026-03-30',
    timezone: 'America/Los_Angeles',
    headline: 'Strong operator day with live dashboard and tenant-state progress.',
    summary: 'Implemented live tenant state and validated the Sandlers pilot workspace.',
    highlights: ['Live Sandlers preset is active', 'Dashboard now reads tenant state files'],
    activity: ['Reset stale webchat session', 'Deployed production dashboard updates'],
    nextUp: ['Validate one real portal workflow'],
  }),
  'state/workflows.json': JSON.stringify({
    version: 1,
    workflows: [
      { name: 'Browser and portal work', description: 'Run live Sandler Portal actions.', status: 'needs-login' },
    ],
  }),
} as const

const messages: ChatMessage[] = [
  {
    role: 'user',
    content: [{ type: 'text', text: 'send updated broadvoice quote to martucci' }],
    timestamp: 1,
  },
  {
    role: 'assistant',
    content: [{ type: 'text', text: 'I can also review National RAM internet proposal and check Fontana signature status.' }],
    timestamp: 2,
  },
]

describe('buildWorkspaceSummary', () => {
  it('builds business context from state files when available', () => {
    const summary = buildWorkspaceSummary({ files, messages })
    expect(summary.business.operator).toBe('Thomas Butcher')
    expect(summary.business.business).toBe('Qortana')
    expect(summary.business.approvedPortals).toContain('Sandler Portal')
    expect(summary.business.authStatuses[0]?.status).toBe('Pending auth')
  })

  it('prefers live task and today state when available', () => {
    const summary = buildWorkspaceSummary({ files, messages })
    expect(summary.tasks.some((task) => /broadvoice quote to martucci/i.test(task.text))).toBe(true)
    expect(summary.todayHeadline).toMatch(/strong operator day/i)
    expect(summary.today.some((section) => section.label === 'Highlights')).toBe(true)
    expect(summary.workflows[0]?.name).toBe('Browser and portal work')
  })

  it('treats an explicit empty task state as empty instead of inferring tasks from chat', () => {
    const summary = buildWorkspaceSummary({
      files: {
        ...files,
        'state/tasks.json': JSON.stringify({ version: 1, tasks: [] }),
      },
      messages,
    })
    expect(summary.tasks).toEqual([])
  })
})
