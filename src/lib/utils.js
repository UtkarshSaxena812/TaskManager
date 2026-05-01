import { clsx } from 'clsx'
import { format, isPast, isToday, parseISO } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  if (!date) {
    return 'No due date'
  }

  return format(parseAppDate(date), 'dd MMM yyyy')
}

export function parseAppDate(date) {
  return parseISO(date)
}

export function isTaskOverdue(task) {
  if (!task?.due_date || task?.status === 'done') {
    return false
  }

  const dueDate = parseAppDate(task.due_date)
  return isPast(dueDate) && !isToday(dueDate)
}

export function getStatusMeta(status) {
  switch (status) {
    case 'done':
      return {
        badge: 'border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100',
        label: 'Done',
      }
    case 'in-progress':
      return {
        badge: 'border border-sky-200 bg-sky-50 text-sky-700 shadow-sm shadow-sky-100',
        label: 'In Progress',
      }
    case 'todo':
    default:
      return {
        badge: 'border border-amber-200 bg-amber-50 text-amber-700 shadow-sm shadow-amber-100',
        label: 'To Do',
      }
  }
}

export function getProjectStateMeta(project) {
  if (project?.is_finished) {
    return {
      badge: 'bg-slate-200 text-slate-700',
      label: 'Finished',
    }
  }

  return {
    badge: 'bg-teal-50 text-teal-700',
    label: 'Active',
  }
}

export async function withTimeout(promise, ms = 10000, message = 'Request timed out.') {
  let timeoutId

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(message))
    }, ms)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    window.clearTimeout(timeoutId)
  }
}
