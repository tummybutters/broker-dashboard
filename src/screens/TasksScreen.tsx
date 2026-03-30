'use client'
import { useGateway } from '@/context/GatewayContext'
import { buildWorkspaceSummary } from '@/lib/workspace/summary'

type Task = { id: string; text: string; status: 'queued' | 'in-progress' | 'waiting' | 'done' }

const STATUS_LABELS: Record<Task['status'], string> = {
  queued: 'Queued',
  'in-progress': 'In Progress',
  waiting: 'Waiting on you',
  done: 'Done',
}

const STATUS_COLORS: Record<Task['status'], string> = {
  queued: 'rgba(118,88,41,0.10)',
  'in-progress': 'rgba(184,148,60,0.15)',
  waiting: 'rgba(251,191,36,0.15)',
  done: 'rgba(34,197,94,0.12)',
}

export default function TasksScreen() {
  const { messages, workspaceFiles, workspaceLoading } = useGateway()
  const tasks = buildWorkspaceSummary({ messages, files: workspaceFiles }).tasks as Task[]

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-8 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="font-sans font-600 text-sm" style={{ color: 'var(--text)' }}>Tasks</h1>
          <p className="text-serif text-xs mt-0.5">
            {workspaceLoading ? 'loading live task state...' : 'shared task list from the live tenant'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-2">
        {tasks.length === 0 && (
          <div className="px-4 py-3 text-sm"
            style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)' }}>
            No tasks are in the shared tenant task list yet.
          </div>
        )}
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-3 px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <input
              type="checkbox"
              checked={task.status === 'done'}
              readOnly
              className="accent-amber-700 w-4 h-4 flex-shrink-0"
            />
            <span className="flex-1 text-sm" style={{ color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text)', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
              {task.text}
            </span>
            <span className="text-xs px-2 py-0.5 font-medium" style={{ background: STATUS_COLORS[task.status], color: 'var(--text-secondary)', borderRadius: '4px' }}>
              {STATUS_LABELS[task.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
