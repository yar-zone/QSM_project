import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function formatDate(date: string | Date): string { return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }

export function formatDateTime(date: string | Date): string { return new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-accent/10 text-accent', inactive: 'bg-gray-100 text-gray-500',
    pending: 'bg-warning/10 text-warning', approved: 'bg-accent/10 text-accent',
    rejected: 'bg-danger/10 text-danger', completed: 'bg-info/10 text-info',
    present: 'bg-accent/10 text-accent', absent: 'bg-danger/10 text-danger',
    late: 'bg-warning/10 text-warning', excused: 'bg-info/10 text-info',
    scheduled: 'bg-info/10 text-info', ongoing: 'bg-warning/10 text-warning',
    cancelled: 'bg-gray-100 text-gray-500',
  }
  return colors[status] || 'bg-gray-100 text-gray-500'
}

export function getInitials(name: string): string { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }
