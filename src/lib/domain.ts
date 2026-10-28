export const STAGES = ['Received', 'Diagnosing', 'Awaiting approval', 'In repair', 'Quality check', 'Ready for pickup', 'Delivered'] as const
export type Stage = typeof STAGES[number]
export type Priority = 'Normal' | 'High'
export interface Customer { id: string; name: string; email: string; phone: string; company: string; color: string }
export interface JobEvent { id: string; at: string; message: string }
export interface Technician { id: string; name: string; specialty: string; color: string }
export interface Quotation extends Estimate {
  id: string
  revision: number
  issuedAt: string
  decision: 'Pending' | 'Approved' | 'Declined'
  decidedAt: string | null
  decisionNote: string
  supersededAt: string | null
  device: string
  issue: string
  dueAt: string
  customerName: string
  customerCompany: string
  customerEmail: string
}
export const PART_CATEGORIES = ['Laptop', 'Desktop', 'Printer', 'Phone', 'General'] as const
export interface Part { id: string; sku: string; name: string; category: typeof PART_CATEGORIES[number]; stock: number; reorderLevel: number; unitCost: number }
export type NewPart = Omit<Part, 'id'>
export interface PartUsage { id: string; partId: string; name: string; sku: string; quantity: number; unitCost: number; at: string; returnedAt: string | null }
export interface StockMovement { id: string; partId: string; delta: number; reason: string; at: string; jobId: string | null }
export const DEVICE_CONDITIONS = ['Not recorded', 'Good', 'Minor wear', 'Visible damage', 'Not powering on'] as const
export const WARRANTY_STATES = ['Not recorded', 'Under warranty', 'Out of warranty', 'Unknown'] as const
export interface DeviceIntake {
  serialNumber: string
  accessories: string
  condition: typeof DEVICE_CONDITIONS[number]
  conditionNotes: string
  warranty: typeof WARRANTY_STATES[number]
  diagnosticNotes: string
}
export const emptyIntake = (): DeviceIntake => ({ serialNumber: '', accessories: '', condition: 'Not recorded', conditionNotes: '', warranty: 'Not recorded', diagnosticNotes: '' })
export interface Job {
  id: string
  customerId: string
  device: string
  category: 'Laptop' | 'Desktop' | 'Printer' | 'Phone'
  issue: string
  stage: Stage
  priority: Priority
  receivedAt: string
  dueAt: string
  parts: number
  labor: number
  paid: boolean
  technicianId: string | null
  intake: DeviceIntake
  quotations: Quotation[]
  partsUsage: PartUsage[]
  events: JobEvent[]
}
export interface Snapshot { version: 3; customers: Customer[]; technicians: Technician[]; jobs: Job[]; parts: Part[]; stockMovements: StockMovement[] }
export interface NewJob { customerId: string; device: string; category: Job['category']; issue: string; priority: Priority; dueAt: string; parts: number; labor: number; technicianId?: string | null; intake?: DeviceIntake }
export interface Estimate { parts: number; labor: number }
export const DEMO_DATE = '2026-10-28'
export const money = (cents: number) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(cents / 100)
export const total = (job: Estimate) => job.parts + job.labor
export const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()
export const isActive = (job: Job) => job.stage !== 'Delivered'
export const shortDate = (date: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Colombo' }).format(new Date(date.length === 10 ? `${date}T12:00:00+05:30` : date))
export const isOverdue = (job: Job) => isActive(job) && job.stage !== 'Ready for pickup' && job.dueAt < DEMO_DATE
export const stageClass = (stage: Stage) => ({ Received: 'slate', Diagnosing: 'blue', 'Awaiting approval': 'amber', 'In repair': 'blue', 'Quality check': 'purple', 'Ready for pickup': 'green', Delivered: 'slate' })[stage]
export const latestQuotation = (job: Job) => job.quotations.at(-1)
export const hasApprovedQuotation = (job: Job) => { const q = latestQuotation(job); return !!q && !q.supersededAt && q.decision === 'Approved' && q.parts === job.parts && q.labor === job.labor }
export const usedPartsCost = (job: Job) => job.partsUsage.filter(u => !u.returnedAt).reduce((sum, u) => sum + u.quantity * u.unitCost, 0)

export function validatePart(input: NewPart) {
  if (typeof input.sku !== 'string' || !/^[A-Z0-9][A-Z0-9-]{1,23}$/.test(input.sku)) throw new Error('Use a unique SKU with 2–24 uppercase letters, numbers or hyphens.')
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 100 || !PART_CATEGORIES.includes(input.category)) throw new Error('Enter a part name up to 100 characters and a valid category.')
  if (![input.stock, input.reorderLevel].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 10000)) throw new Error('Stock and reorder levels must be whole numbers between 0 and 10,000.')
  validateEstimate({ parts: input.unitCost, labor: 0 })
}

export function filterJobs(jobs: Job[], customers: Customer[], query: string, stage: Stage | 'All' = 'All', technician: string = 'All') {
  const term = query.trim().toLowerCase()
  return jobs.filter(job => (stage === 'All' || job.stage === stage) && (technician === 'All' || (technician === 'Unassigned' ? job.technicianId === null : job.technicianId === technician)) && `${job.id} ${job.device} ${job.issue} ${job.intake.serialNumber} ${customers.find(c => c.id === job.customerId)?.name ?? ''}`.toLowerCase().includes(term))
}

export function validateIntake(value: unknown): asserts value is DeviceIntake {
  if (!value || typeof value !== 'object') throw new Error('Enter valid device intake details.')
  const intake = value as Record<string, unknown>
  for (const [key, max] of [['serialNumber', 80], ['accessories', 240], ['conditionNotes', 500], ['diagnosticNotes', 1500]] as const) {
    if (typeof intake[key] !== 'string' || intake[key].length > max) throw new Error(`Invalid ${key}: use up to ${max} characters.`)
  }
  if (!DEVICE_CONDITIONS.includes(intake.condition as DeviceIntake['condition']) || !WARRANTY_STATES.includes(intake.warranty as DeviceIntake['warranty'])) throw new Error('Choose a valid device condition and warranty state.')
}

export function validateEstimate(estimate: Estimate) {
  for (const value of [estimate.parts, estimate.labor]) {
    if (!Number.isSafeInteger(value) || value < 0 || value > 100_000_000) throw new Error('Enter a valid cost between 0 and 1,000,000 LKR.')
  }
}

export function parseMoney(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error('Enter a positive amount with up to two decimal places.')
  const cents = Math.round(Number(value) * 100)
  validateEstimate({ parts: cents, labor: 0 })
  return cents
}

export function whatsappUrl(phone: string, message: string) {
  const normalized = phone.replace(/[\s()+-]/g, '')
  if (!/^[1-9]\d{7,14}$/.test(normalized)) throw new Error('Enter 8–15 digits including the country code, without a leading zero.')
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}
