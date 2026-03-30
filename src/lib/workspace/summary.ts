import type { ChatMessage } from '@/lib/gateway/types'

export type WorkspaceFiles = Partial<Record<
  'AGENTS.md' | 'USER.md' | 'TOOLS.md' | 'MEMORY.md' | 'IDENTITY.md' | 'MVP-DEFINITION.md' | 'state/tasks.json' | 'state/today.json' | 'state/business.json' | 'state/workflows.json',
  string
>>

export type TodaySection = {
  label: string
  items: string[]
}

export type TaskStatus = 'queued' | 'in-progress' | 'waiting' | 'done'

export type TaskItem = {
  id: string
  text: string
  status: TaskStatus
  source?: 'human' | 'assistant' | 'system'
  notes?: string
}

export type WorkflowCard = {
  name: string
  description: string
  status: 'ready' | 'needs-login' | 'limited'
}

export type BusinessProfile = {
  operator: string
  business: string
  territory: string
  role: string
  topServices: string[]
  approvedPortals: string[]
  approvedSystems: string[]
  channelStatus: string
  authStatuses: Array<{ label: string; status: string; notes?: string }>
}

export type WorkspaceSummary = {
  business: BusinessProfile
  workflows: WorkflowCard[]
  today: TodaySection[]
  todayHeadline: string
  todaySummary: string
  tasks: TaskItem[]
}

type TasksState = {
  version?: number
  updatedAt?: string
  tasks?: Array<{
    id?: string
    title?: string
    status?: TaskStatus
    source?: 'human' | 'assistant' | 'system'
    notes?: string
  }>
}

type TodayState = {
  version?: number
  date?: string
  timezone?: string
  headline?: string
  summary?: string
  highlights?: string[]
  activity?: string[]
  nextUp?: string[]
}

type BusinessState = {
  version?: number
  updatedAt?: string
  profile?: {
    operator?: string
    business?: string
    territory?: string
    role?: string
    topServices?: string[]
  }
  approvedPortals?: string[]
  approvedSystems?: string[]
  channelStatus?: string
  authStatuses?: Array<{ label?: string; status?: string; notes?: string }>
}

type WorkflowsState = {
  version?: number
  updatedAt?: string
  workflows?: Array<{ name?: string; description?: string; status?: 'ready' | 'needs-login' | 'limited' }>
}

function parseJson<T>(value: string | undefined): T | null {
  if (!value?.trim()) {return null}
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function readLabeledValue(content: string | undefined, label: string): string {
  if (!content) {return ''}
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = content.match(new RegExp(`^-\\s+\\*\\*${escaped}:\\*\\*\\s+(.+)$`, 'mi'))
  return match?.[1]?.trim() ?? ''
}

function readPlainBulletValue(content: string | undefined, label: string): string {
  if (!content) {return ''}
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = content.match(new RegExp(`^-\\s+${escaped}:\\s+(.+)$`, 'mi'))
  return match?.[1]?.trim() ?? ''
}

function readSection(content: string | undefined, heading: string): string[] {
  if (!content) {return []}
  const lines = content.split('\n')
  const out: string[] = []
  let inSection = false

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line.startsWith('## ')) {
      inSection = line === `## ${heading}`
      continue
    }
    if (!inSection) {continue}
    const bullet = line.match(/^- (.+)$/)
    if (bullet) {
      out.push(bullet[1].trim())
      continue
    }
    if (line.trim() === '') {continue}
    if (!line.startsWith('- ')) {break}
  }

  return out
}

function splitList(value: string): string[] {
  return value
    .split(/,\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function messageText(message: ChatMessage): string {
  return message.content
    .map((part) => typeof part.text === 'string' ? part.text : '')
    .join('\n')
    .trim()
}

function normalizeCandidate(text: string): string {
  return text
    .replace(/^[\s>*-]+/, '')
    .replace(/^(please|can you|could you|i need you to|ask assistant to)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function shouldTrackTask(text: string): boolean {
  if (!text) {return false}
  if (text.length < 12 || text.length > 140) {return false}
  if (/^what\b|^who\b|^when\b|^where\b|^why\b/i.test(text)) {return false}
  return /(send|review|follow up|check|confirm|draft|run|prepare|update|connect|preserve|install|verify|finish|test|quote|submit|complete|pull|fix|summarize|auth|portal|crm|workflow|business)/i.test(text)
}

function sentenceCase(text: string): string {
  if (!text) {return text}
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function deriveTasksFromMessages(messages: ChatMessage[]): TaskItem[] {
  const candidates = new Map<string, TaskItem>()

  for (const message of messages.slice(-40)) {
    const text = messageText(message)
    if (!text) {continue}

    const parts = text
      .split(/\n|(?<=[.!?])\s+/)
      .map(normalizeCandidate)
      .filter(shouldTrackTask)

    for (const part of parts) {
      const normalized = part.toLowerCase()
      if (candidates.has(normalized)) {continue}
      const status = /(pending|awaiting|waiting|follow up|check|confirm|signature|decision|blocked|auth)/i.test(part)
        ? 'waiting'
        : /(send|review|run|draft|prepare|test|validate|fix|finish|update)/i.test(part)
          ? 'in-progress'
          : 'queued'
      candidates.set(normalized, {
        id: normalized,
        text: sentenceCase(part.replace(/[.]+$/, '')),
        status,
        source: 'assistant',
      })
    }
  }

  return Array.from(candidates.values()).slice(0, 12)
}

function deriveBusinessFromDocs(files: WorkspaceFiles): BusinessProfile {
  const user = files['USER.md']
  const tools = files['TOOLS.md']

  const topServices = splitList(readLabeledValue(user, 'Top services sold'))
  const approvedPortals = splitList(readPlainBulletValue(tools, 'Approved portals'))
  const approvedSystems = [
    readPlainBulletValue(tools, 'Inbox layer'),
    readPlainBulletValue(tools, 'Primary Google surfaces'),
    readPlainBulletValue(tools, 'Primary CRM'),
    readPlainBulletValue(tools, 'PDF / e-sign stack'),
  ]
    .flatMap(splitList)
    .filter((value) => value && !/^not fixed yet$/i.test(value))

  return {
    operator: readLabeledValue(user, 'Name'),
    business: readLabeledValue(user, 'Business name'),
    territory: readLabeledValue(user, 'Territory'),
    role: readLabeledValue(user, 'Role type'),
    topServices,
    approvedPortals,
    approvedSystems,
    channelStatus: readPlainBulletValue(tools, 'Channel status'),
    authStatuses: [],
  }
}

function deriveWorkflowsFromDocs(files: WorkspaceFiles): WorkflowCard[] {
  const tools = files['TOOLS.md']
  const agents = files['AGENTS.md']

  const portalNotes = readPlainBulletValue(tools, 'Portal workflow notes')
  const googleStatus = readPlainBulletValue(tools, 'Auth status')
  const messagingStatus = readPlainBulletValue(tools, 'Channel status')
  const crmNotes = readPlainBulletValue(tools, 'CRM notes')
  const docTools = readPlainBulletValue(tools, 'PDF / e-sign stack')
  const telephony = readPlainBulletValue(tools, 'Telephony layer')

  const defaultTools = readSection(agents, 'Tools')
  const hasFollowUp = defaultTools.some((line) => line.includes('follow-up-drafting'))
  const hasCrm = defaultTools.some((line) => line.includes('crm-note-prep'))
  const hasBrowser = defaultTools.some((line) => line.includes('playwright-cli'))

  const workflowStatus = (value: string): WorkflowCard['status'] => {
    const normalized = value.toLowerCase()
    if (!normalized) {return 'limited'}
    if (/pending|not fully configured|when authenticated|needs|configure|onboarding/i.test(normalized)) {
      return 'needs-login'
    }
    if (/live|preserve|ready|preferred|approved/i.test(normalized)) {
      return 'ready'
    }
    return 'limited'
  }

  return [
    {
      name: 'Browser and portal work',
      description: portalNotes || 'Use browser automation for live portal actions and form work.',
      status: hasBrowser ? workflowStatus(portalNotes || 'ready') : 'limited',
    },
    {
      name: 'Follow-up drafting',
      description: hasFollowUp
        ? 'Draft replies, waiting-on notes, and next-step summaries from live conversations.'
        : 'Follow-up flow is not yet configured in the workspace.',
      status: hasFollowUp ? 'ready' : 'limited',
    },
    {
      name: 'CRM-ready notes',
      description: crmNotes || 'Prepare structured internal notes before any CRM write.',
      status: hasCrm ? workflowStatus(crmNotes || 'ready') : 'limited',
    },
    {
      name: 'Google Workspace actions',
      description: googleStatus ? `Google Workspace auth status: ${googleStatus}.` : 'Google Workspace status not documented yet.',
      status: workflowStatus(googleStatus),
    },
    {
      name: 'Messaging and live channel work',
      description: messagingStatus || 'Primary channel status is not documented yet.',
      status: workflowStatus(messagingStatus),
    },
    {
      name: 'Document and signature workflows',
      description: docTools || telephony || 'Document workflow stack is not documented yet.',
      status: workflowStatus(docTools || telephony),
    },
  ]
}

function buildTodayFromState(state: TodayState | null, fallbackTasks: TaskItem[]) {
  if (!state) {
    return {
      headline: '',
      summary: '',
      sections: [
        { label: 'Tasks in motion', items: fallbackTasks.map((task) => task.text).slice(0, 6) },
      ].filter((section) => section.items.length > 0),
    }
  }

  return {
    headline: state.headline?.trim() ?? '',
    summary: state.summary?.trim() ?? '',
    sections: [
      { label: 'Highlights', items: state.highlights ?? [] },
      { label: 'Activity', items: state.activity ?? [] },
      { label: 'Next up', items: state.nextUp ?? [] },
    ].filter((section) => section.items.length > 0),
  }
}

export function buildWorkspaceSummary(args: {
  messages: ChatMessage[]
  files: WorkspaceFiles
}): WorkspaceSummary {
  const tasksState = parseJson<TasksState>(args.files['state/tasks.json'])
  const todayState = parseJson<TodayState>(args.files['state/today.json'])
  const businessState = parseJson<BusinessState>(args.files['state/business.json'])
  const workflowsState = parseJson<WorkflowsState>(args.files['state/workflows.json'])

  const fallbackTasks = deriveTasksFromMessages(args.messages)
  const hasExplicitTasksState = Array.isArray(tasksState?.tasks)
  const tasks = hasExplicitTasksState
    ? tasksState!.tasks!
        .filter((task) => task && typeof task.title === 'string' && task.title.trim())
        .filter((task) => task.status !== 'done')
        .map((task) => ({
          id: task.id?.trim() || task.title!.trim().toLowerCase(),
          text: task.title!.trim(),
          status: task.status ?? 'queued',
          source: task.source,
          notes: task.notes,
        }))
    : fallbackTasks

  const today = buildTodayFromState(todayState, tasks)
  const businessFallback = deriveBusinessFromDocs(args.files)
  const business: BusinessProfile = businessState
    ? {
        operator: businessState.profile?.operator?.trim() || businessFallback.operator,
        business: businessState.profile?.business?.trim() || businessFallback.business,
        territory: businessState.profile?.territory?.trim() || businessFallback.territory,
        role: businessState.profile?.role?.trim() || businessFallback.role,
        topServices: businessState.profile?.topServices?.filter(Boolean) ?? businessFallback.topServices,
        approvedPortals: businessState.approvedPortals?.filter(Boolean) ?? businessFallback.approvedPortals,
        approvedSystems: businessState.approvedSystems?.filter(Boolean) ?? businessFallback.approvedSystems,
        channelStatus: businessState.channelStatus?.trim() || businessFallback.channelStatus,
        authStatuses: (businessState.authStatuses ?? [])
          .filter((item) => item?.label && item?.status)
          .map((item) => ({
            label: item.label!.trim(),
            status: item.status!.trim(),
            notes: item.notes?.trim(),
          })),
      }
    : businessFallback

  const workflows = workflowsState?.workflows?.length
    ? workflowsState.workflows
        .filter((workflow) => workflow?.name && workflow?.description)
        .map((workflow) => ({
          name: workflow.name!.trim(),
          description: workflow.description!.trim(),
          status: workflow.status ?? 'limited',
        }))
    : deriveWorkflowsFromDocs(args.files)

  return {
    business,
    workflows,
    today: today.sections,
    todayHeadline: today.headline,
    todaySummary: today.summary,
    tasks,
  }
}
