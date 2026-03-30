'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'

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
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Follow up with Southland Technology', status: 'waiting' },
    { id: '2', text: 'Send Broadvoice quote to Martucci', status: 'in-progress' },
    { id: '3', text: 'Review National RAM proposal', status: 'queued' },
  ])
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')

  function addTask() {
    if (!newText.trim()) {return}
    setTasks(t => [...t, { id: Date.now().toString(), text: newText.trim(), status: 'queued' }])
    setNewText('')
    setAdding(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-8 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="font-sans font-600 text-sm" style={{ color: 'var(--text)' }}>Tasks</h1>
          <p className="text-serif text-xs mt-0.5">what needs doing</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
          style={{ background: 'var(--text)', color: '#faf6ef', borderRadius: '6px' }}
        >
          <Plus size={13} /> Add Task
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-2">
        {adding && (
          <div className="flex gap-2 mb-4">
            <input
              autoFocus
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Task description..."
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{ border: '1px solid var(--border-mid)', borderRadius: '6px', background: 'rgba(255,255,255,0.7)', color: 'var(--text)' }}
            />
            <button onClick={addTask} className="px-3 py-2 text-xs font-medium" style={{ background: 'var(--text)', color: '#faf6ef', borderRadius: '6px' }}>Add</button>
            <button onClick={() => setAdding(false)} className="px-3 py-2 text-xs font-medium" style={{ border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)' }}>Cancel</button>
          </div>
        )}
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-3 px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <input
              type="checkbox"
              checked={task.status === 'done'}
              onChange={() => setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status: t.status === 'done' ? 'queued' : 'done' } : t))}
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
