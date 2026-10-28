import { DEMO_DATE, isActive, total } from './domain'
import type { Job, Snapshot } from './domain'

const dayFormatter = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Colombo' })
export function dateKey(timestamp: string) {
  const parts = dayFormatter.formatToParts(new Date(timestamp))
  return ['year', 'month', 'day'].map(key => parts.find(p => p.type === key)?.value).join('-')
}
export function reportJobs(jobs: Job[], from: string, to: string, scope: string) {
  return jobs.filter(j => { const day = dateKey(j.receivedAt); return (!from || day >= from) && (!to || day <= to) && (scope === 'All' || (scope === 'Active' ? isActive(j) : !isActive(j))) })
}
export function reportMetrics(jobs: Job[]) {
  const completed = jobs.filter(j => j.stage === 'Delivered')
  const turnaround = completed.flatMap(j => { const event = [...j.events].reverse().find(e => e.message === 'Repair stage updated to Delivered.'); const hours = event ? (Date.parse(event.at) - Date.parse(j.receivedAt)) / 3600000 : -1; return hours >= 0 ? [hours] : [] })
  return { count: jobs.length, active: jobs.filter(isActive).length, completed: completed.length, paid: jobs.filter(j => j.paid).reduce((sum, j) => sum + total(j), 0), unpaid: jobs.filter(j => !j.paid).reduce((sum, j) => sum + total(j), 0), averageHours: turnaround.length ? turnaround.reduce((a, b) => a + b, 0) / turnaround.length : null, turnaroundCount: turnaround.length }
}
export function activitySeries(jobs: Job[], period: 'week' | 'month', reference = DEMO_DATE) {
  const span = period === 'week' ? 1 : 7, count = period === 'week' ? 7 : 4
  const end = Date.parse(`${reference}T00:00:00Z`), start = end - (span * count - 1) * 86400000
  const received = Array<number>(count).fill(0), completed = Array<number>(count).fill(0)
  function add(date: string, values: number[]) { const bucket = Math.floor((Date.parse(`${dateKey(date)}T00:00:00Z`) - start) / (span * 86400000)); if (bucket >= 0 && bucket < count) values[bucket]++ }
  for (const job of jobs) {
    add(job.receivedAt, received)
    if (job.stage === 'Delivered') { const event = [...job.events].reverse().find(e => e.message === 'Repair stage updated to Delivered.'); if (event) add(event.at, completed) }
  }
  const labels = received.map((_, i) => period === 'month' ? `Week ${i + 1}` : new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(new Date(start + i * 86400000)))
  return { received, completed, labels }
}
function csvCell(value: string | number) {
  let text = String(value)
  if (/^[\s]*[=+@-]|^[\t\r\n]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}
export function jobsCsv(jobs: Job[], snapshot: Snapshot) {
  const rows: (string | number)[][] = [['SYNTHETIC DEMO ONLY - NOT ACCOUNTING RECORDS'], ['Job', 'Device', 'Stage', 'Priority', 'Technician', 'Received date (Asia/Colombo)', 'Due date', 'Parts estimate (LKR)', 'Labor estimate (LKR)', 'Total estimate (LKR)', 'Demo payment recorded']]
  for (const job of jobs) rows.push([job.id, job.device, job.stage, job.priority, snapshot.technicians.find(t => t.id === job.technicianId)?.name ?? 'Unassigned', dateKey(job.receivedAt), job.dueAt, (job.parts / 100).toFixed(2), (job.labor / 100).toFixed(2), (total(job) / 100).toFixed(2), job.paid ? 'Yes - synthetic' : 'No'])
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n')
}
